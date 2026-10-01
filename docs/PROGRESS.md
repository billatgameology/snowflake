# Progress — The Virtual Cloud Chamber

**This file is the compact, authoritative current-state index. Read it completely and leave it
true after every session that changes anything.** Rules: [AGENTS.md](../AGENTS.md). Governing spec:
[project charter.md](../project%20charter.md). The handoff mechanism is retired (maker direction
2026-08-20): this index plus the active plans are the sole live state, and work proceeds in
isolated worktrees per Rule 16.

## Historical record

The complete pre-compaction state and chronology through 2026-08-02 (Phases 0–5 and early
Phase 6) are preserved byte-for-byte in
[progress-history-through-2026-08-02.md](progress-history-through-2026-08-02.md); its body is
byte- and SHA-256-pinned by `runner/test/progress-index.test.ts`. The detailed Phase 6, 8, and
9 entries pruned from this index on 2026-08-20 are preserved as last written in
[progress-history-phases-6-8-9.md](progress-history-phases-6-8-9.md). Both are historical, not
current authority; open them only when this index, a plan, ADR, or audit links to historical
detail.

## Current state

- **Current science wave complete and reviewed (2026-10-01); expansion paused.** The
  [completed cavity/history report](../evidence/post-phase10-wave-2026-10-01/README.md)
  preserves the final comparisons and raw run archives. Early-growth cavity memory survives
  switch-off; grid-dependent waist thickness remains a limitation. The next action is
  three-machine consolidation under **Next step**, not another experiment launch.
  Publication verification is recorded in
  [verification.json](../evidence/post-phase10-wave-2026-10-01/verification.json):
  `npm.cmd test` passed Rule 7, both typechecks and 2612 tests, but retained the same
  18 failed tests and one suite-load failure as the September 12 baseline; not suite green.

- **macOS dev-server guard defect fixed; NAS closeout checked from the Mac (2026-09-09).** On this
  Mac the documented `npm run dev --workspace app -- --port 5191` served every gallery page as an
  unstyled "Loading…" shell. The repository-local `/@fs` guard in `app/vite.config.ts` strips
  `/@fs/` and then requires an absolute path, but on POSIX Vite emits `/@fs/Users/...` with the
  leading slash consumed, so every hoisted `node_modules` module (Vite's own `env.mjs` first) was
  refused while the double-slash fixtures in `runner/test/vite-nas-serving.test.ts` stayed green;
  Windows was unaffected because its remainder is `C:/...`. The fix mirrors Vite's `fsPathFromId`
  (re-prefix the slash, then the same allow/deny decision) with a regression test on the emitted
  form; a pre-fix/post-fix probe returned 403/204 for `env.mjs` and 403/403 for an `out/` file.
  Focused boundary tests 23/23, typecheck, Rule 7 (1,330 files) and the app build pass
  (`out/nas-verify-2026-09-09/fix-checks.log`). The change is committed on branch
  `fix/vite-fs-guard-posix`; the visual-studies section under Next step holds its PR and merge record. Separately, the marked
  `snowcrystal` share mounted at `/Volumes/snowcrystal`; `assets:verify` confirmed both owner
  manifests and aggregates without reading payload; the gallery-facing subset of
  `render-worktrees-closeout@2026-09-04` copied to local `out/` matched the tracked manifest
  byte-for-byte (315 files / 388,459,029 bytes in `out/nas-verify-2026-09-09/gallery-subset-copy.json`;
  99 volume previews in `volume-previews-copy.json`); and the `--full` hash verify of that
  collection, followed by the scientific collection, started at 2026-09-09T23:31:09Z
  (`out/nas-verify-2026-09-09/full.timeline.log`, `*.full.log`, `*.full.exit`). The documented
  130 GB + 84 GB local restore cannot run on this Mac (41 GiB free); the closeout section below
  records that. The dev server on `127.0.0.1:5191` now serves all 151 animations from that subset.
- **Animation/main integration is resolved (2026-09-06).** The maker requested a PR and merge.
  Both Vite gallery services and the newer main records are retained. A missing-local-scenes
  startup failure is corrected by validating generated Compose files on request; the hash and
  growth allowlist checks remain enforced. App build, fresh-checkout service tests and a browser
  smoke pass (`out/main-integration/build-final.log`, `catalog-test.log`, `browser-smoke.json`).
  The [integration follow-up](plans/dendrite-visual-studies.md) records full-check and publication work;
  [PR #11](https://github.com/billatgameology/snowflake/pull/11) holds the live checks and merge record.
  Exact `npm test` is **not green**: 35 failures / 2,308 passes / 49 skipped
  (`out/main-integration/npm-test-final.log`). All 35 failing test names reproduce in an untouched
  checkout of fetched main (`main-baseline-test.log`, `baseline-comparison.json` there). The app
  checks pass; existing catalog test assumptions and Windows byte identities need separate repair.

- **The animation history is published through the connected GitHub app.** The maker approved
  new commit IDs. The [commit map](animation-github-publication.json) records the ordered source
  sequence through its publication plan, with identical file-tree SHAs checked for each replacement.
  The branch is `fix/animation-queue-windows-spawn`; the local originals are retained under
  `backup/animation-before-github-publication-20260906`. The
  [publication follow-up](plans/dendrite-visual-studies.md) records the checks. Next: continue
  from the published branch and use the map when resolving references to original commit IDs.

- **Two Views is complete.** Branch Journey is removed,
  and branch detail fills the right column with stronger default zoom. The final
  [visual-study follow-up](plans/dendrite-visual-studies.md) records the change. Focused pane/data
  tests, typecheck, Rule 7 and app build pass. The browser smoke verifies both panes, closer zoom,
  seeking, graphs and export restoration, with zero colored pixels in all 16 gutter samples and
  no unexpected browser errors (`out/two-views/browser-smoke.json`). Its actual 1080p MP4 decodes
  successfully and was visually inspected. The bottom-right legend now uses Timeglass's same
  **EARLY → LATE** gradient; desktop/phone matching checks pass
  (`out/two-views-legend/browser-check.json`). Next: open the Two Views link below.

- **Web pane cropping and Crystal Cast centering are corrected.** Rendering uses displayed
  canvas bounds and Cast's own offscreen pixel viewport. The preceding product checks are
  preserved in `out/branch-flight/browser-smoke.json` and `out/three-views/browser-smoke.json`;
  the final [visual-study follow-up](plans/dendrite-visual-studies.md) records the current
  two-pane simplification. Source coordinates, chronology and graph calculations are preserved.

- **Phase 6 is COMPLETE (2026-08-20).** The maker accepts the recorded failure to reproduce the
  Nakaya diagram as the phase's scientific finding. Decision
  [0045](decisions/0045-bound-phase6-closure-to-a-compute-week.md) and charter v1.22 defined the
  discharge and every element executed: the frozen WP1 strata; the three measured-only arms
  (CAK 3/90; M1 54/78 arm scope, 54/90 common denominator; `M1_NO_DIP_ABLATION` 5/78, 5/90); the
  80/80 numerical-control ladder with its published **NO-PASS (criterion)** verdict and
  review-confirmed re-derivation; the pinned
  [three-arm narrative](../evidence/phase6-three-arm-report/report.md) stating agreements,
  disagreements, numerical limits, and the accepted failure; and the flagless `gate6`, which
  re-derives all of it from committed evidence and exited 0 (13/13 criteria; repro:
  `node runner/src/main.ts gate6`). ADR 0026's conservative-intersection headline, R15's
  production path, and the full three-arm campaign closed at measured-only grade — stated as
  not computed by decision 0045, never as satisfied. No Phase 6 label was upgraded; the phase
  closes with zero quantitative-validation claims, and the 0043/0044 deferrals stay Phase 7
  property with no Phase 6 credit.
- **Phase 8 is COMPLETE (Phase 8A 2026-08-10; Phase 8B 2026-08-12).**
  Decision [0048](decisions/0048-focus-phase8b-on-phase9-ready-benchmarks.md) and charter v1.25
  preserve the completed [Phase 8A target book](plans/phase-8-what-is-real.md) byte-for-byte and
  focus the [Phase 8B corpus](plans/phase-8-measurement-corpus.md) on measurements Phase 9 can use.
  The [plain-English guide](phase8-baseline-guide.md) maps measured families to tests, limits and
  Git/NAS artifacts.
  Phase 8B writes separate artifacts; the immutable Phase 8A book remains 59,019 bytes / SHA-256
  `47a75f3fcc499d74d36cd08eeaed7f4e839bf991deb179fa19ce809d57e171ec`.
  Quoted from [`evidence/phase8b-benchmark-final-v1/report.json`](../evidence/phase8b-benchmark-final-v1/report.json):
  the successor contains 51 model-development records (18 P0 / 28 P1 / 5 P2), zero held-out rows,
  252,134 native history rows, 431 adjudicated plot points and zero P2 coordinate rows. Its
  independent verifier returned `ok=true`; successor-target-book SHA-256 is
  `c54b89683eea1f064bd8e81d6e9e06b3b9bbc6c022168b981cbfa71e5fc3cdd3`. The targeted pass is
  terminal and bounded, not global literature closure; the corrected residual sample is 0/9 misses
  after preserving and remediating its original Bacon miss. Phase 8B itself scored no model,
  supplied no adoption authority, and cannot grant a validation label. The exact full suite passed 97/97
  files; the detached clean-checkout verifier and 51 focused tests passed; and the final non-author audit
  returned zero blockers after its two bookkeeping findings were repaired. Phase 7 is completely
  standalone, unstarted and requires its own plan/worktree; Phase 10 was still uncharted when
  Phase 8 closed.
- **Phase 9 is COMPLETE (development-only, 2026-08-13).**
  Decision [0050](decisions/0050-adopt-phase9-modular-physics-experiments.md), charter v1.27 and the
  [execution plan](plans/phase-9-execution.md) authorized isolated Mac development. S0B's
  [report](../evidence/phase9-source-overlay-v1/report.json) (6,530 bytes; SHA-256 `51e1fa2b…63d8a`)
  resolves 70 aliases to 59 complete artifacts. The files record an in-session shelf freeze before
  scoring; detailed S0B and scored-result bytes first entered Git together in `1efe127`, so
  Git ordering cannot independently prove that sequence. S1 maps all 51 rows through fail-closed adapters. All 51 Phase 8B records remain development evidence.
  Separate [verification receipts](../evidence/phase9-publication-verification-v1/) bind the clean-head
  commands and stdout for D-BT (`central-no-effect-or-failure`, Lamb `431.3416` versus rescale
  `0.6578183`, 0/6 wins, 24 no-flip sensitivities) and M-F/M-K2
  (`diagnostic-mapping-dependent`, 2/5, physical score unavailable). Other arms stop at reviewed
  source/analytic/refusal foundations; the all-no-pass branch closed:
  zero promotions and no combination campaign. Exact `TMPDIR=/private/tmp npm test` passed at
  completion; a later [different-model external review](reviews/phase9-external-review-2026-08-13.md)
  re-ran it as 115/115 files, 1,912 passed and seven skipped; the
  [post-review repair run](reviews/phase9-external-review-repairs-2026-08-13.md) passed 116/116 and
  1,924. Phase 9 cannot grant a quantitative-validation label or earn Phase 6/7 credit. The Mac
  lane ran only source/scalar/planar work; Phase 6's Windows evidence
  host, processes, artifacts, and then-unpublished verdict remained isolated throughout. The
  [maker guide](phase9-model-development-guide.md) explains the data, methods, results, and next evidence.
- **The Phase 9 knowledge baseline is COMPLETE (research-only, 2026-08-12).** Its
  [report](../research/phase9-knowledge-sources.md), [guide](phase9-knowledge-guide.md), and
  [artifact](../evidence/phase9-knowledge-baseline-v1/report.json) (5,263 bytes; SHA-256
  `37c7aadf18bce7420883930f66d6c6a473100dd27e1468dd8396a3c1214b1f96`) preserve 18 sources and
  15 hypotheses. It is now a bound S0B input; no model ran during its construction.
- Snow Crystal Journey media proceeds in parallel. Transcript entries `JTS-M006`/`JTS-M007` record
  the one-long-documentary source, manga-like scroll story/autoplay export, and intent to continue
  through Phase 10. The versioned narrative score and fixed-frame export interpretation is recorded
  by plan commit `86fe656`; Chapter 1 remains the bounded pilot and scientific authority is unchanged.
- The maker-directed compact G-G growth replay is **COMPLETE AS A LOCAL VERIFIED CANDIDATE** under
  [explore-gutcheck-growth-volume.md](plans/explore-gutcheck-growth-volume.md); governed NAS
  publication is deferred. Commit `44fd4b6` records exact attachment index/tick events and renders a
  separately labeled smoothed surface without changing solver/phase authority or replacing the
  immutable 701 meshes. `out/gutcheck-growth-runB/live.log` records the restart-only Run B exit at
  tick 70,000 after 36,348.1 solver seconds under its original Node v24.13.1 engine. The asset is
  7,695,060 bytes, SHA-256
  `475c1f7c227c45b005bfdb8691b1250599b405fa59902462110312a4f26ceb7d`; strict validation plus a
  separate handwritten parser are bound by the 618-byte and 1,234-byte records named in the plan.
  They confirmed 961,597 unique ordered events, the canonical seed, ticks 0–70,000, the
  593×593×17 crop, source/runtime identity and reconstructed 69,120,000-cell occupancy SHA-256
  `9c98fe41e5ea2f6b2020063218b37255877548bdeb49dadf4235a4cf039cf9f7`.
  `out/gutcheck-growth-runB/comparison-record-v2.json` (3,002 bytes, SHA-256
  `5488f738f3068e74cfdbc38e07c35c1a30e21fe73f891a22ab1e8d50399086f8`) derives the measured
  6,622,194,703-byte quantized sequence versus the 7,695,060-byte compact asset: 861x smaller after
  rounding. The accepted Chromium/SwiftShader v5 browser record is 48,961 bytes, SHA-256
  `ea194edc23dd583d9591c5009449c96d45f515291664b1baf76f8d508a3f2cb1`; it passed play/pause,
  exact seek/reverse, orbit, keyboard, reduced motion, portrait/desktop containment and five scoped
  failure lanes while fetching one compact asset and zero legacy meshes. The non-author closing
  reviews found no blocker/high issue. Final exact `TMPDIR=/private/tmp npm test` passed 123/123
  files, 2,091 tests with 8 skipped; its 33,723-byte log is
  `out/checks/gutcheck-growth-final-npm-test-v3.log`, SHA-256
  `8750759f51abe23f45e72dc1bac1424b7417c94f8330b4ae67a026a01bc67fe4`. The parallel NAS migration
  retired the old top-level `out/` destination; do not run or retarget the legacy publisher, recreate
  aliases, or claim public availability. Forward publication waits for the governed catalogue,
  owner-manifest, receipt and fresh-restore contract.
- The [glass/camera follow-up](plans/explore-gutcheck-growth-glass-camera.md) is **IMPLEMENTED AS A
  LOCAL CANDIDATE; BROWSER/VISUAL ACCEPTANCE IS PENDING**. It binds the compact replay to the exact
  `growth-B-intro` clock/camera track, retains exact-tick/manual-orbit/reduced-motion paths, and labels
  the shader `GLASS-STYLED · MODEL / UNVALIDATED`; the panes are not live-transport-locked. Exact
  `TMPDIR=/private/tmp npm test`, the app build and non-author source audit passed after four named
  repairs recorded in the plan. No browser session was available, so there is no fresh WebGL visual
  verdict; v5 remains evidence only for the prior bold-ice/stationary-camera version.
- **The Journey/media branch is reconciled with current `main` for review (2026-09-12).** Branch
  `explore/education-ch1-video` merged fetched `origin/main` at `c2dd1d4`, retaining both the
  compact `?growth=` replay and the newer composed `?growthScene=` presentation path. The conflict
  resolution also keeps both Vite entry points and separates the historical compact-comparison NAS
  lookup from the governed collection detector. The Rule 16 audit found this as the sole PR branch;
  the clean `main` worktree and unattached `plan/phase10-options` branch are unrelated, while ignored
  `out/gutcheck-growth-runB/` remains the plan-governed local candidate and is excluded from Git.
  Focused replay/NAS/progress tests, both loopback-serving test files with bind permission, typecheck,
  and the app build pass. Exact `TMPDIR=/private/tmp npm test` reproduces the already documented
  `main` catalog failures; its extra sandbox-only bind failures pass in the focused permitted runs.
  Merge commit `5ef0d69` is published in
  [PR #13](https://github.com/billatgameology/snowflake/pull/13); this does not close the pending
  browser/visual or Rule 13 review boundaries.
- **Maker directions (2026-08-20).** Phase 7 is on hold and, when resumed, runs as a parallel
  product/engineering track beside the science workstream (charter v1.23 already makes it
  standalone; this adds no new authority and starts nothing). The handoff mechanism is retired:
  [HANDOFF.md](HANDOFF.md) is a tombstone kept only for the byte-frozen archive's links, and its
  test pin now enforces the tombstone. The maker clarified that the Phase 10 A+B text was
  brainstorming and **selected no Phase 10 package (2026-08-20)**. Commit `f51f58e` recorded that
  brainstorm as a selection before the correction arrived; this live index and the
  [decision-ready candidate plan](plans/phase-10-closures-and-frontier.md) supersede that status
  statement. At the close of 2026-08-20, Phase 10 remained uncharted, no execution plan was active,
  and no scientific PC run was authorized.
- **Phase 10 is COMPLETE (complete-negative, 2026-08-25).** The maker accepted the candidate plan's
  recommended **A-S + A-I + B + C0 + C0V with packet-specific A-P** package. The separate C1–C5
  numerical qualification work, including the early attached-count/domain sentinel and every
  scientific habit row, is explicitly unselected. The completed
  [execution plan](plans/phase-10-evidence-verification-execution.md) runs in the isolated
  `phase10/evidence-verification` branch at `G:\Code Files\snowflake-phase10-evidence`. The S0
  governance checkpoint is complete: accepted
  [decision 0052](decisions/0052-adopt-phase10-evidence-verification.md), charter v1.28, the active
  plan, state reconciliation, and complete charter-diff audit landed together before source
  consumption or package implementation. S1 now freezes the 21-packet, 112-output, 140-check,
  23-negative-control obligation graph and its three conditional groups. The registered matrix is
  125,508 bytes / SHA-256 `8f85e6febad1ec7568b2a7a47dd764c260cc1f602da08c7dd27d5ee1a6c1bab3`; its
  foundation is 32,327 bytes / SHA-256
  `7847f26a24d1a09eefc6b15ed07baf1d007782fdd58c3301e3f926e4c8805871`; and its schema
  registry is 114,255 bytes / SHA-256
  `c89463c37384d5652b57c039e26f0c612b08a2d9bb5994482bbf750eae121c70`. The focused
  preflight suite passes 14/14, both required mutations refuse, and a non-author contract review
  reports zero unresolved blockers. Exact `npm test` is the S1 checkpoint check. S2 has now frozen
  the independently audited 69-row A-S classification protocol as separate 18-entry Phase 8A and
  51-record Phase 8B rosters. Before that commit, two temporary focused-test invocations derived
  throwaway candidate bytes from the real frozen corpus; they are recorded as invalid ordering
  attempts, retained and published nothing, changed no classification, and do not count as S2
  verification. The executable checkpoint resolves the real A-P and A-S registries and their
  independently reviewed static lifecycles; its exact `npm test` passed 135/135 files and 2,250
  tests with 49 skipped. From clean head `ce2d9e62c17336060381d9bc806e4379f744070d`, A-P then
  published a six-file PASS bundle: 12 artifacts reopened, 11/11 checks passed, and both mandatory
  missing-producer and uncalled-check mutations executed and were rejected. Its independently
  rederived evidence landed at `63ca13c0de16f01f224c60e7fe29405b2798cf0e`. From that clean
  head, A-S published separate 18-entry Phase 8A and 51-record Phase 8B overlays: all 11 checks pass
  and all four named mutations execute and are rejected. A non-author evidence review rederived
  every row, count, role, ownership, eligibility, claim boundary, and dependency with zero
  blockers. A-S reports scope in/mixed/out/unresolved = 9/1/3/5 for Phase 8A and 31/0/2/18 for
  Phase 8B, with quantitative eligibility 0 in both. Its seven files total 537,246 bytes and are
  pinned in the 363-file / 4,874,715-byte evidence manifest. Exact post-publication `npm test`
  passes 135/135 files and 2,250 tests with 49 skipped. The implementation checkpoint froze the
  independently reviewed A-I and C0/executor lifecycles in commit `ae2f90d`, with every protocol,
  registry, and transitive callable byte and all three future A-I inputs absent. From that freeze,
  A-I executed its exact 24-query observation roster: 22 requests returned HTTP 200, two returned
  429, and the bounded NAS check ended `unavailable-refusal` without a storage/current-presence
  claim. Commit `9fb2e1b` then added exactly the validated observation, 14-payload decision, and
  zero-blocker non-author semantic-review inputs. All 14 payload dispositions are terminal but
  conservatively refused; none of the retained payloads was opened. A-I's artifact-derived
  verification passes 7/7 checks and publishes eight files totaling 83,538 bytes, including the
  7,395-byte [intake report](../evidence/phase10-scope-intake-v1/intake-report.json) at SHA-256
  `5ca8650a0c6baf707a8d0243ff14cb741de227e79080217030925aca37e4df52` and 4,293-byte
  [verification](../evidence/phase10-scope-intake-v1/intake-verification.json) at SHA-256
  `ae04b87627c1e9e2bd9152f413fa44d025cc6a0dc682c07337f80bbf40cb1c96`. At the A-I checkpoint,
  the manifest pinned 371 files / 4,958,253 bytes; C0 then had no valid derivation, solver row,
  publication, or scientific result. That A-I result is a structural intake PASS, not source
  availability, scientific validation, downstream authorization, or prior-phase credit.
- **Phase 10 C0 implementation trap (found 2026-08-21).** The frozen WP2 plan, primary evaluator,
  its mixed pass/fail controls, and `gate6` require every spacing to pass before the top-level result
  can pass. The later post-execution independent script uses `some` instead of `every`. Both
  published spacings are no-pass, so the historical verdict is unchanged. C0 must freeze the
  all-spacings rule, test both mixed directions, and retain the old script mismatch as a historical
  verifier limit; see the active plan's **Tried and rejected** record. During implementation, one
  overly broad repository-root `rg` printed matching real ladder-row lines to tool stdout. No value
  was analyzed or used, no output was retained or published, and that author is excluded from the
  unopened-input independent review; the active plan records the exact command and limit.
- **Phase 10 C0V S6 implementation freeze is complete (2026-08-24; no execution credit).** The dedicated
  parent-side preflight observer now reopens both locks, Git/manifest authority, the exact baseline
  and accepted-prefix physical-copy census, parent-monotonic process totals, dependencies,
  projections, and the single admissible pass/refusal route. It recursively rejects unknown,
  aliased, or hard-linked files under the governed publication, baseline, attempt, and lock roots;
  every earlier chronological prefix is independently deep-reproved before preflight publication.
  The historical root
  `.gitattributes` is byte-identical to its Phase 8 freeze; scoped child rules preserve raw source
  bytes, while root-only metadata uses HEAD-blob plus Git-filter equivalence. The packet catalogue
  now freezes the exact parent-executor and worker-dispatcher exports plus the bounded canonical
  JSONL/ACK transport; the implementation-freeze evaluator independently audits both complete
  raw import closures, direct exports, external packages, builtins, forbidden paths/hooks, and
  TypeScript parser-runtime receipt without treating either orchestrator as a claim callable.
  The exact lock-issued watchdog is now authenticated against the same active `run` locks and
  authority and synchronously checked around preflight/final publication and lock-cleanup
  eligibility; an overrun after packet-lock cleanup retains the package lock. Both runtime
  entrypoints also require empty `process.execArgv`, reject case-insensitive `NODE*`/`TS_NODE*`
  environment keys visible at entry, and independently require the complete exact eight-row worker
  environment; the parent constructs only that catalogue roster and clones no ambient value.
  Maker review classified deliberately self-erasing preloads, PID/process impersonation, and a
  deliberately misbehaving authenticated peer as hostile-runtime attacks outside charter §3.3 and
  decisions 0042/0049. The rejected native-launcher contract, protocol boundary rosters, marker,
  channel implementation, and 25-test channel suite have therefore been removed from live S6
  authority and runtime code; the detailed proposal remains only as rejected history in the active
  plan. Reintroducing either catalogue or protocol launcher fields is now a strict-parser negative
  control. Worker stdout is capped at 4,194,304 retained aggregate bytes
  with exact per-message shape/count budgets, stderr at 33,554,432 bytes, and every packet freezes
  the remaining non-log attempt-root census bound. Its scratch projection is exactly the sum of
  those three maxima; equality is accepted and an additional byte fail-stops.
  Radial negative-control cap routes now preserve their exact attempted invocation prefix only as
  raw timing/partial-execution fact: every cap terminal/candidate executed-control roster is empty,
  and a coherent mutation that promotes a completed control is rejected. A-P, moving-produce, and
  moving-publish now project the terminal candidate only in memory through category limits,
  census, resource, receipt, and closed-world validation; physical candidate creation is later and
  independent audit found no post-write route/content selection. Verification-v2 now freezes
  truthful route-aware execution provenance: it is null on every structurally verified radial
  artifact/prelaunch/registered-cap refusal and non-null only after a real completed main
  evaluator on a normal credit-bearing route. That authority blocker is cleared, and the locked
  raw radial finalizer plus parent worker/dispatch state machine are implemented; all route
  readiness flags become true together in this common implementation freeze, and no radial
  finalizer output exists. The parent hard-codes the five
  governed leaves, retains/reopens every artifact before acknowledgement, and authenticates each
  registered LF-arrival boundary. The radial stdout boundary/progress count is 28 (3,088,384
  derived bytes), including all eight Robin internal-case lines. Radial `invocation-finished` and
  `worker-stopped` now preserve the active case and cumulative progress while setting only
  `caseId` null, so a mid-case production cap remains representable; its focused parser/writer
  regression passes 6/6.
  `check` remains lock-free and explicitly non-authorizing. `run` becomes eligible only from this
  common clean implementation-freeze commit and still reopens all mutable authority beneath both
  locks before it may write. At the earlier
  portability checkpoint, focused Phase 8, observer, and executor tests pass 71/71 on its recorded
  bytes. On the current watchdog/loader
  regenerated pre-pause authority snapshot, all eight packet protocols and callable registries plus
  the catalogue, matrix, and schema registry strict-parse, while the schema contracts
  canonical-parse and are identity-bound; its combined authority/launcher-channel/worker-progress/
  watchdog/radial set passed 67/67 and observer/dispatch/worker/publication passed 34/34. The final paused
  implementation bytes then passed exact `npm test`: 154/154 test files, 2,510 passed and 49
  skipped in 1,326.31 seconds, including Rule 7 across 1,229 files and both TypeScript checks.
  This is a pre-freeze implementation check, not an implementation freeze, an S6 attempt, or
  scientific evidence.
  At the explicit pause boundary, the append/fsync/reopen radial worker-progress writer, its
  retained-candidate identity gate and infrastructure-stop retention, and both authenticated
  watchdog handoffs (evaluator-to-first-control and post-artifact deferred control start) are
  implemented. On the post-resume authority cleanup, the regenerated live catalogue, schema
  contracts, and all eight protocols contain no launcher prerequisite. The completed radial-parent
  checkpoint passes its six focused files at 103/103; `npx tsc -p tsconfig.json --noEmit`, Rule 7
  across 1,228 files, and `git diff --check` also pass. Exact `npm test` has not been rerun on these
  bytes and remains the required pre-freeze check after all eight runtime paths are complete.
  All eight vertical paths are wired in the implementation freeze.
  Aggregate executes its exact three-leaf control/producer/caller roster, reopens the complete
  seven-packet chronological dependency closure, and finalizes its four candidate outputs plus
  verification-v2 and terminal-v2 without a solver path. All 101 callable registrations are
  resolved to exact live module identities, every route-readiness flag is true, and final authority
  was regenerated in a disposable worktree; the normalized authority diff changed only callable
  resolution/identity and each protocol's bound registry identity. Thirteen focused S6 files pass
  94/94 in 144.03 seconds. The active plan's final S6 checkpoint records the exact final-byte
  `npm test`: 157/157 files and 2,495 passed with 49 skipped in 1,654.54 seconds, including Rule 7
  clean across 1,231 files and both TypeScript checks. The single bounded non-author audit found
  and prompted repair of two real deep-prefix blockers: the original `a-p` dependency needed to
  remain an external terminal, and chronological accounting had been incorrectly equated with a
  packet's direct logical dependencies. Its post-repair audit reran three focused files at 14/14,
  rechecked all 101 callable registrations with zero identity inconsistencies, and closed with zero
  unresolved blockers; the active plan records its provenance and limits.
  AGENTS Rule 14 now has mandatory threat-admission and delivery-first procedures because the
  existing proportionality rule did not prevent assurance and coordination work from displacing
  the unwired radial parent deliverable. No registered command, solver, attempt, or evidence output
  ran during the cleanup.
  From clean pushed freeze `27ca0dea801be026f6b3729d5d898a8856c42722`, the exact supplemental
  A-P read-only `check` then exited 0 and created no state. Its one registered v1 `run` failed
  closed before preflight, attempt, worker, solver, receipt, or evidence creation because the
  observer compared raw `v24.13.1` with registered label `Node v24.13.1`. This retained only
  `package.lock` (220 bytes / `8275c6d4…22bfe`) and `a-p-c0v-s6.lock` (176 bytes /
  `b9805c91…81f02`), both naming dead PID 53684; the attempt root, all six finals, and all six
  stages remain absent. The 396 bytes earn zero worker/process-hour, packet, or scientific credit.
  V1 must not be rerun or altered. The smallest package-wide, non-destructive recovery-v1 successor
  is now implemented in its first-introduction freeze checkpoint: exact predecessor-state reproof,
  new lock/attempt paths, sole new A-P attempt `a-p-c0v-s6-20260822-v2`, and unchanged science/caps.
  Exact `npm test` passed 157/157 files with 2,499 passed and 49 skipped tests; one bounded non-author
  audit re-derived both locks, all 13 absences, and 101 callable registrations and reported zero
  blockers. From pushed freeze `df24330f`, A-P v2 `check` passed without writes; its one `run`
  published a passing preflight, then the worker refused before `ready` because Windows carried nine
  normal OS rows beyond the frozen eight-row child environment. No governed invocation or science
  ran. Recovery-v1's immutable addition is 63,920 bytes. Recovery-v2 is now implemented with an
  exact 17-row child roster, fresh A-P v3 attempt/output paths, and otherwise unchanged science/caps.
  Exact `npm test` passed 157/157 files with 2,501 passed and 49 skipped tests; one bounded non-author
  audit rederived all ten retained artifacts, 25 absences, and 101 registrations and reported zero
  blockers. From pushed freeze `d670494b`, A-P v3 `check` passed without writes; its one `run`
  published a passing preflight and completed all four governed worker invocations, then the parent
  refused before terminal-candidate materialization because the immutable matrix's v2 output path
  was treated as the live v3 publication path. The tuple earns zero packet/scientific/success
  credit, but recovery resource accounting carries forward 125,289,842,000 governed ns =
  0.0348027338888889 process-hours. Its 429,172 new bytes are retained, including the preflight to
  be manifest-pinned; cumulative S6 retention is 493,488 bytes and the next baseline is 2,123,065.
  Recovery-v3 implemented the bounded exact-ID lifecycle overlay and entered clean pushed freeze
  `4286c61`. Its one v4 run completed four governed invocations but finalization reused immutable
  matrix paths instead of current paths, so no terminal bundle was published and no packet/science
  credit was earned. All 433,513 new bytes are retained. Recovery-v4 now implements the bounded
  resolver reuse and entered clean pushed freeze `7ff83ea`. Its one v5 run completed four governed
  invocations but final verification rejected a conflated physical/semantic digest before any
  terminal publication. All 437,809 new bytes are retained. Recovery-v5 implemented the bounded
  digest split and active receipt-baseline repair and entered clean pushed freeze `d47b803`. Its one
  A-P v6 run is now terminal `complete`: verification passes 10/10 checks, both controls executed
  and were rejected, and the terminal grants packet/dependency credit. The six finals are pinned;
  no solver ran and no scientific claim is made. From pushed A-P evidence checkpoint `e092259`,
  moving-produce v1 `check` passed without writes, but its one `run` fail-stopped before preflight,
  attempt creation, worker start, or science because the prior-packet accounting reader omitted
  A-P's three registered `candidate/` files from its exact nine-file attempt roster. Only two stale
  locks / 440 bytes remain; PID 52792 is dead and the stop earns zero execution or scientific
  credit. A-P v6 remains accepted. Recovery-v6 now implements the exact existing-roster join,
  historical A-P reopening, and sole moving-produce v2 authorization. Its one v2 `check` passed
  without writes, but its one `run` fail-stopped immediately after locking because five private
  executor literals still named moving v1. Only two locks / 440 bytes remain; no preflight,
  attempt, worker, or science ran. Recovery-v7 will unify those five sites behind the current
  moving-attempt authority and authorize only v2 to v3. Its one v3 `check` passed without writes,
  but its one `run` fail-stopped during prior-A-P observation because the observer compared all six
  current v6 outputs to immutable v2 matrix paths. Only two locks / 440 bytes remain; no preflight,
  attempt, worker, or science ran. Recovery-v8 repaired that complete six-output observer join,
  passed exact `npm test` and the bounded non-author audit, and entered pushed freeze `0abc4b5`.
  Its v4 check wrote nothing. Its one run produced a passing preflight and one completed governed
  moving-discrepancy invocation with no solver, then fail-stopped in finalization because the
  shared whole-file resolver rejected the exact immutable moving protocol binding before it could
  reach the equally immutable reference binding. Nine retained files total 102,985 bytes; no
  packet, publication, science, or validation credit was earned. The active plan records the
  bounded recovery-v9 successor. No consumed tuple may be rerun.
  Recovery-v9 now implements only that path-authority repair: after the unchanged A-P overlay, the
  shared resolver admits exact immutable science/reference bindings while keeping them outside the
  writable publication roster. Moving-produce alone advances v4 to v5; exactly its three structural
  finals and moving-publish dependencies move from the occupied v2 paths to the fresh v3 subtree.
  The authority reopens 73 retained files / 2,106,790 bytes, proves 80 governed absences, and binds
  the unchanged science, reference, cap, route, claim, A-P v6, and six other v1 contracts. Focused
  tests passed 113/113. Exact `npm test` passed Rule 7 across 1,419 files, both typechecks, and
  162/162 Vitest files with 2,522 passed / 49 skipped in 1,259.25 seconds. One bounded non-author
  audit independently rehashed the retained state and all 101 callable identities, compared all
  eight predecessor/successor protocol-registry pairs, passed its bounded 103/103 checks, and closed
  with zero blockers. No registered command, worker, solver, finalizer, attempt, or output ran
  before the freeze.
  Recovery-v9 entered clean pushed freeze `910f84d`. Its v5 `check` exited 0, reported
  `executableNow: true`, and wrote nothing. Its sole run published a passing preflight and completed
  one 33,757,900-ns moving-discrepancy invocation with no solver, then fail-stopped when
  `currentProducePublicationArtifacts()` compared the fresh v3 preflight path directly with the
  immutable matrix's v2 path. Nine retained files total 106,861 bytes; the preflight is pinned, and
  no candidate, ledger, verification, terminal, packet, publication, science, or validation credit
  exists. Moving v5 is consumed. By maker direction on 2026-08-24, recovery-v10 and further S6
  moving-recovery work are stopped. S6 moving remains unresolved with zero packet/scientific credit;
  its pinned S5b `reference-discrepancy-refusal` remains valid evidence but is not relabeled as a
  completed S6 packet. The maker explicitly resumed work through Phase 10 completion on 2026-08-25.
  The bounded Windows/SMB copied-file timestamp repair passed 36 focused transaction tests with six
  platform skips and both TypeScript checks. The exact stale B transaction was reverified and
  cleared without reacquisition; publication and fresh restore then completed. The active private
  collection contains one 9,040,679-byte file at SHA-256
  `4f2a07813efb55f920b30a34c49e8ae009a7b1f3f6804efb30a308dae5f7fe0f`, and both collection-specific
  full-hash commands pass. The finalized `b-acquisition` packet passes 2/2 registered checks with
  terminal `refusal`: five exact sources are rights-blocked and Zhao S2 is acquired-and-bound.
  S7 is complete. From clean pushed branch publication `caf1392`, `b-aggregate` passed all six
  registered checks and published terminal `refusal`: six terminal branches, 48 unresolved operands,
  zero searches, six null return proposals, and no E/F/H execution or authorization. Its six files
  total 32,748 bytes and bring the pinned evidence manifest to 445 files / 6,524,192 bytes. Minimum
  C0V/package closure is now the active deliverable; no further moving-recovery ladder is authorized.
  Decision 0054 and charter v1.30 now authorize one exact closure of the maker-terminated recovery-v9
  state: radial remains not executed, moving/static retain only their S5 refusal meanings, C0V is
  incomplete/non-PASS with no S6 packet credit, and package completion rests on the terminal B
  refusal. The finite report producer and independently re-deriving flagless `gate10` are now
  implemented: the focused final-package/progress/evidence set passes 17/17, both TypeScript checks
  pass, and Rule 7 is clean across 1,506 files. From pushed freeze `621c4ec`, the single report is
  published at 9,195 bytes / SHA-256
  `34f4bcc2956b40ce7d57c4776f1e3c0c5f90e724ffcc39743692173a9a818372`; its direct derivation and
  evidence-integrity checks pass 10/10. The single required exact `npm test` passed at clean
  `298caf85d10d4c0466e5035b97dc4deb4e96c9a5`: 165/165 files, 2,533 passed and 49 skipped, exit 0,
  with no duplicate run. Its 329-byte receipt is SHA-256
  `c81bed5fc8c5b4d61abcf4f497d09da4b69df7110968d5fc8834381fb204aade`; the manifest pins 447 files /
  6,533,716 bytes. The one bounded non-author closure review then passed with zero unresolved
  blockers and confirmed the exact B-refusal/C0V-incomplete/no-credit claim boundary; its 1,850-byte
  receipt is SHA-256 `b87b1e96647ffb97b5bac215bae15f824a52079112caf95c859e90bdbe002942`,
  bringing the manifest to 448 files / 6,535,566 bytes. From clean review checkpoint `2823189`, the
  gate publisher passed all seven re-derived checks and wrote a 2,692-byte receipt at SHA-256
  `acb7d178cc5bc73bbf140fbfd7ec8c8e409b3292c7941b1c1f422fb848137e39`; the manifest now pins 449
  files / 6,538,258 bytes. The next action is to commit that receipt and run the flagless gate once.
  No recovery-v10 is created.
- **Assurance is proportional to decision risk.** [Decision 0049](decisions/0049-make-assurance-proportionate-to-decision-risk.md),
  charter v1.26 and `AGENTS.md` require integrity for routine sources, one targeted check for
  load-bearing inputs, and full named controls for gates or strong public claims. No recursive
  reviews; stop when another check cannot change the decision. No evidence or criteria changed.
- **Maker verification boundary (2026-08-24).** Isolated website, gallery, animation-selection,
  render-recipe, and batch-orchestration changes use focused tests, relevant typecheck/build checks,
  and a live smoke or representative render. They do not trigger exact `npm test`, scientific gates,
  or unrelated solver suites unless they also change a scientific, evidence, gate, or root-wide
  contract. `AGENTS.md` Rule 6 is the durable operating rule; completed records still state checks
  that actually ran but do not establish precedent.
- **The GG gut-check catalogue now leads with its image-bearing generated sweep (2026-08-23).**
  The governed NAS split intentionally leaves historical mixed comparison/reference media
  unserved, but 89 project-generated PNG renders remain public and healthy. The index formerly
  placed 37 model-only orphan links ahead of them, making the thumbnails appear absent; the
  generator now orders the generated-crystal gallery first and a regression pins that priority.
  This is an operational UX correction only and changes no scientific evidence or phase state.
- **The maker-directed animation selection, growth replay, website library, and scientific-bundle
  NAS copy/registration are COMPLETE (2026-08-29).** The completed
  [queue plan](plans/gutcheck-animation-selection-queue.md) adds preview-adjacent selection,
  portable manifests, deterministic disjoint batches, and the later growth-event path. The Windows
  fleet completed 52 web assets and 52 full scientific bundles; the maker kept the original `fig6`,
  and the website library serves the other 51 from `snowcrystal_website`. The local scientific tree
  at `out/growth-scientific/` contains 6,308 files / 84,247,312,054 bytes. Maker direction on
  2026-08-29 direction copied it as generated-cache collection
  `gutcheck-growth-scientific@2026-08-26`. It is active at
  `collections/gutcheck-growth-scientific/2026-08-26/payload`, with 6,308 files /
  84,247,312,054 bytes / tree SHA-256
  `4a1e18634896a58b5e8acf26a041c75de72982bd32a665cae7762976f6465f3e`. The tracked 6,308-row owner
  manifest tells the project every exact NAS path. Two earlier Windows/SMB attempts failed closed
  and remain preserved in non-served quarantine; no local deletion was authorized or performed.
  The [publication plan](plans/gutcheck-growth-scientific-nas-publication.md) records the receipts
  and narrowed no-restore scope. A later fresh-process full verifier on 2026-09-04 reopened all
  6,308 files / 84,247,312,054 bytes and returned `ok=true`, `payload=verified-full` with zero
  defects. A subsequently started local restore was stopped under the maker's narrowed direction;
  its incomplete duplicate remains local and is not closeout evidence.
- **The named snow-crystal animation catalog is COMPLETE (2026-08-31).** The strict
  [catalog](named-snow-crystal-catalog.json) and linked [text table](named-snow-crystal-catalog.md)
  report all 35 Libbrecht guide names exactly once: 33 included types with three accepted animations
  each, plus `Rimed` and `Graupel` visibly excluded because this work adds no droplet-accretion
  physics. Final totals are 99 accepted / zero remaining, 22 direct GG/GG+ families and 11 explicitly
  composed families. All 99 decoder-verified cold web payloads are below 20,000,000 bytes and range
  from 4,769 to 10,923,005 bytes. The 66 direct entries retain 8,999 scientific files /
  110,701,619,469 bytes with 101–121 mesh frames each; the 33 Compose records bind exact component
  scientific identities without claiming a composed scene is one solver state. The exact
  [Compose review](named-snow-crystal-final-compose-review.json) is 50,204 bytes / SHA-256
  `212434bf4704763ccdd33d17b063a79f4305c020fc9e89024046f372e9e0ac19` and binds all 297 real-browser
  captures after live clearance and visual progression review. The catalog plan contains the exact
  report/contact-sheet/catalog identities and final product-sized checks.
- **The named snow-crystal local gallery is COMPLETE (2026-08-31).** The dedicated loopback page
  renders all 35 taxonomy rows and 99 accepted variant cards with previews, payload metadata,
  search, route filters and click-to-play animation. Its exact allowlist API preserves the generic
  Vite `out/` denial and distinguishes direct G-G/G-G+ recordings from Compose. A live Playwright
  smoke counted 35 rows / 99 cards, confirmed unknown/generic-`out` denial, and completed one direct
  and one Compose playback. The server is running at `http://127.0.0.1:5173/named-crystal-catalog.html`;
  PID and logs are under `out/named-crystal-gallery-site/`.
- **Render-worktree NAS closeout is active (2026-09-04).** Maker direction now requests a simple,
  non-destructive NAS copy of the generated output from all three worktrees, the standard tracked
  owner manifest and publication receipt, and a pull request to `main`. The maker will merge and
  test restoration on another computer. No worktree, branch, local output, or NAS byte is removed;
  cleanup is explicitly deferred until the maker confirms that restore. The immutable
  `render-worktrees-closeout@2026-09-04` payload is now published: 18,932 files /
  130,479,382,836 bytes / tree SHA-256
  `1a2f9d0f4758a1f54e73f4d11e6da31046d041417f890020c1c7f9e2175960c2`. Its tracked 18,932-row
  owner manifest is 5,337,142 bytes / SHA-256
  `c9489ad64f6e693f09853ab35863b158e23dc3107c618c9cdd8282789d8b8a8d`; the standard publication
  receipt is recorded in the closeout plan. Focused closeout checks passed, the feature branch is
  pushed, and [PR #10](https://github.com/billatgameology/snowflake/pull/10) is open against `main`.
- Historical extent-21 artifacts remain valid measured-only comparisons: **CAK 3/90, M1 54/90**
  over their named scopes. They are not the registered conservative-intersection verdict, which
  decision 0045 closed as not computed.
- CAK→M1 is a confounded parameter-family comparison. Only matched M1 versus
  `M1_NO_DIP_ABLATION` may isolate the implemented dip factors' effect on this solver under the
  frozen configuration; it **cannot establish physical SDAK causality or necessity** in nature.
- **Visual-study catalogue correction is complete (2026-09-04).** The maker identified the newer
  accepted named catalogue in `../snowflake-named-catalog/docs/named-snow-crystal-catalog.json`.
  The correction in [the visual-study plan](plans/dendrite-visual-studies.md) adds its accepted
  named recordings and explicitly composed scenes to all four views. The live index reports
  151 available entries, including 99 named entries (`out/named-growth-studies/live-index.json`).
- **Visual animation browser is complete (2026-09-04).** The large dropdown is replaced by
  **Browse crystals**, a thumbnail gallery with search, shape/collection filters, dendrites first
  and click-to-play in the current view. The [visual-study plan](plans/dendrite-visual-studies.md)
  records implementation and checks. The browser smoke verified 151 cards and decoded Timeglass
  previews, zero full recording downloads on browse-first entry and no unexpected errors
  (`out/growth-gallery/browser-smoke.json`). Keyboard focus, phone layout, selection, playback,
  filter/scroll retention and broken-image fallback pass. Next: open the gallery link below.
- **Last updated:** 2026-10-01 (local consolidation in progress; no scientific-claim change)
- **Optional graphs and MP4 export are complete.** Single views offer attached-site,
  interval-attachment and outward-reach graphs with independent toggles and synchronized seeking.
  **Export MP4** creates the current treatment/camera in H.264, with optional graphs. Actual UI
  downloads pass 720p/1080p stream decoding; composed statistics, cancellation/restoration and
  mobile checks pass (`out/growth-insights/browser-smoke.json`). Exact `npm test` passed:
  143 files, 2,248 tests passed / 49 skipped (`out/growth-insights/npm-test-final.log`, exit 0).
  Build passed. The [visual-study follow-up](plans/dendrite-visual-studies.md) records the controls,
  canonical Windows temporary-path fix and earlier rejected attempts. Next: use the controls below
  the single animation. No solver or source recording has changed.
- **Education is reconciled through Phase 10 and published again (2026-09-05).** Chapters 1–29 keep
  the teaching baseline with their stale Phase 6 status boundary corrected; Chapters 30–33 teach the
  unstarted Phase 7 plan and the Phase 8–10 records as development and refusal evidence, never
  validation. Chapters 30–33 describe the Phase 10 package as recorded on the
  `phase10/evidence-verification` branch (complete-negative, 2026-08-25); that completed scientific record is now included in this integration. An independent
  six-agent review corrected 47 factual and seven accessibility findings before the merge; the
  public verifier then passed 37 pages, 191 checks, 0 failures and 149 negative controls
  (2026-09-04T00:24:43Z). The Pages deploy workflow retired on 2026-08-16 is restored by maker
  direction (`.github/workflows/pages.yml`: `main`-only trigger, 37-page pin, manifest-pinned public
  artifact, no research media), so pushes to `main` touching `docs/education/**` republish
  https://billatgameology.github.io/snowflake/. Exact `npm test` closure for the education plan is
  still pending an idle host; see the [education plan](plans/education-phase7-10-continuation.md).
  Full freeze history: [the history file](progress-history-phases-6-8-9.md).
- **Chapters 30–33 now carry worked examples and recomputing demos (2026-09-15).** The maker asked on
  2026-09-09 why Chapters 30–33 look light on examples beside Chapters 1–5. A two-pass multi-agent
  audit measured it — all twenty "interactives" were tab strips, with no slider, no SVG, no canvas
  and nothing recomputed from reader input, and zero equation blocks — and produced 77 ranked
  proposals, published 2026-09-14. Its [continuation plan](plans/education-ch30-33-demos.md) is
  implemented in branch `docs/education-ch30-33-demos` off `docs/education-phase10`: nine confirmed
  errata corrected, the three misleading figures replaced or rebuilt (`c31-blender`'s literal
  "73 / 100", `c31-matcher`'s uncommitted mirror-plane case, `c33-error-sources`'s mismatched bar
  widths), five equation blocks with *where* lists added, the ch30 three-arm and ch33 knob tables
  added, eight glossary headwords added, and twelve new interactives built on one shared component
  module — among them a live Runge–Kutta integration of the committed sphere-growth rule against the
  six recorded D-BT conditions, the thirteen gate6 and seven gate10 criteria as sabotage boards, and
  all 64 C0 ladder comparisons as a dot strip with a what-if tolerance line. Two independent
  multi-agent passes re-derived every load-bearing number from the committed records and
  adversarially reviewed the result; every confirmed finding was fixed. Checks on the final bytes:
  the public education verifier passes (37 pages, 205 visual roots, 191 checks, 222 profile loads,
  149 negative controls, zero failures), the offline build exits 0, screenshots pass 16/16 profiles,
  `npm run lint:rule7` is clean across 1,518 files, `node --check` passes on every changed script,
  and `git diff --check` is clean. Exact `npm test` was **not** run: an unrelated 18-process
  discovery campaign held the host, and this work touches only `docs/education/`, its plan and this
  index. No evidence artifact, phase gate, solver or validation label changed; Phase 6 stays
  measured-only, Phase 7 stays not started, and Phases 8–10 stay development or refusal.

## Phase gates

A scientific gate is complete only through named, reproducible evidence. Detailed review history
and every superseded attempt live in the linked plans and historical progress snapshot.

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
| 7 | Not started; independently eligible | Charter v1.25 preserves Phase 7's independence but does not start it. A committed Phase 7 plan and isolated worktree are required; product, held-out validation, and v6 WGSL/preview-GPU parity remain its scope. |
| 8 | **Complete (8A + 8B)** | The immutable 8A book remains 18 entries / 59,019 bytes / SHA-256 `47a75f3f…71ec`. The verified 8B successor is 51 development records, 252,134 native rows and 431 plot points; no row is held out. [Completed plan](plans/phase-8-measurement-corpus.md). |
| 9 | **Complete (development-only)** | The all-no-pass branch closed: D-BT failed, M-F/M-K2 stayed mapping-dependent, controls/path-state/M-PK are unavailable or non-identifiable, and zero items promoted. Exact `TMPDIR=/private/tmp npm test` passed; no result grants validation credit. [Completed plan](plans/phase-9-execution.md). |
| 10 | **Complete (negative package; B refusal; C0V incomplete/NO-PASS)** | `gate10` exit 0 at `e2cca93`: 7/7 closure checks re-derive `complete-negative` from terminal B refusal while preserving C0 criterion NO-PASS and C0V incomplete/non-PASS with radial no-verdict, moving/static S5 refusals, and zero S6 packet credit. Exact `npm test` at `298caf8` passed 165/165 files, 2,533 tests with 49 skipped; the bounded non-author review found zero unresolved blockers. The 2,692-byte gate receipt is SHA-256 `acb7d178…37e39`; the manifest pins 449 files / 6,538,258 bytes. No C1–C5 row, habit row, target score, validation claim, downstream authorization, solver change, or prior-phase credit exists. Repro: `node runner/src/main.ts gate10`. |

**Post-Phase-10 discovery campaign is complete (2026-08-28).** The maker authorized a fresh
parallel CPU campaign in isolated worktree
`G:\Code Files\snowflake-science-exploration`, branch `explore/post-phase10-discovery`. The
[completed plan](plans/post-phase10-discovery-campaign.md) ran all 31 registered rows: seven
numerical/domain/timestep/seed rows including one conditional N112 run, and 24 matched M1/no-dip
trajectory rows across four temperature/forcing neighborhoods. The initial 30 workers ran at
actual maximum concurrency 12 and all exited 0; the eligible N112 worker also exited 0. All 31
terminal results are admissible. This is exploratory model-development work, not Phase 7, a
Phase 10 reopening, a solver change, or a validation gate.

The observational runner and finite launcher are now implemented without a `core/` or
`solver-cpu/` change. Focused Vitest passed 4/4, runner typecheck passed, Rule 7 is clean across
1,514 files, and the corrected two-process smoke passed 2/2 at
`out/post-phase10-discovery/smoke-5d9204b-v2`. The first smoke directory records a launcher-only
unknown-row failure before either solver ran; the active plan records the exact cause and repair.
Exact `npm test` ran once because the runner emits scientific readouts. Rule 7 and both typechecks
passed; Vitest finished 158/166 files and 2,500 passed / 14 failed / 72 skipped tests in 1,100.81
seconds. The discovery test passed 4/4. All failures are confined to completed Phase 10 tests:
eight reopen ignored recovery bytes absent from this fresh worktree, while the remaining
scope/B/final-package failures reproduce historical LF-versus-CRLF identity assumptions. The
active plan records concrete byte examples. The suite is not called green; unrelated Phase 10
fixture repair and recovery-tree copying are deliberately outside this science checkpoint.

The compact analysis is
`evidence/post-phase10-discovery-campaign-v1/analysis.json` (77,960 bytes, SHA-256
`5c267a01dcdfa04bd0611415812f0a4cd0424a902536c6eb226def815ec04806`), with readable report
`README.md` (5,113 bytes, SHA-256
`4efb66ecebee1b11215401a6601e16bddcab93265db0b7740de6d0534d7e78a2`). A80/A96 ended with
identical 7,693 attached cells and aspect ratio 1.2272727272727273; A112 retained that aspect ratio
with 7,717 attached cells (+0.311972% from A96). The `cflFill = 0.05` final attached-count and
aspect-ratio effects were identical at N80 and N96 (-288 and +0.05844155844155852), giving zero
interaction for those final observables. Signed seed perturbations reversed between total count
and post-seed growth, demonstrating local initialization memory. Across the matched trajectories,
M1/no-dip aspect-ratio contrast has opposite signs in the warm (-5/-6 C) and cold (-19/-24 C)
neighborhoods; its magnitude weakens with forcing except for a nearly flat -5 C sequence.
Cumulative attachment orientation changes sign across -24 C forcing and is nonmonotonic at -19 C,
making facet-specific ablation and transition localization the strongest next discovery targets.
These are measured implementation-level patterns, not physical-cause claims.

## Active plan

The current task is [local consolidation](plans/local-consolidation-2026-10-01.md): merge ready
local work, preserve useful ignored output on NAS, and close only fully preserved extra worktrees.
The other computer's website/film branch is excluded; no new experiment is authorized by this task.

Current action: the cavity/grid and early/late history wave is complete; see **Next step**
for the consolidation pause and the linked scientific report. The campaign chronology below
is retained context; the detailed active plan begins with the closing findings.

The [adaptive discovery follow-up](plans/post-phase10-adaptive-discovery.md) is the sole active
science plan. Its pilot, N64/extent-29 long wave, and 58-row confirmation wave 1 are complete. Wave
1 ran from `cb33534e` at actual maximum concurrency 32; all 58 rows exited zero and a direct census
found the exact roster, zero stderr, and 58 admissible size-target results with extent 29, exact D6h
symmetry, converged relaxation, and zero integrity errors. Its ignored completion record is
`out/post-phase10-confirmation/campaign-2026-09-02-wave1/confirmation-wave-1-complete.json`
(14,537 bytes / SHA-256
`26a0b5e8ac5b47e310abf9f123120a68574922584638f03adab15bc8e85a1f09`). The result localizes the
seed-shape-by-arm sign transition between -8 and -9 C, preserves the -6 C pressure forcing reversal,
preserves strong -14.4/-24 C pressure interactions while leaving -19 C trajectory-sensitive,
preserves M1-only sixfold arm depth at -12/-14.4/-18 C, and preserves open warm M1 axial cavities at
-4.5/-5 C under half timestep. The active plan records the exact matched values and comparison
rules. A finite 134-row wave 2 is pre-registered for crossover localization/forcing, the 20 mixed
map-trajectory timestep controls, selected N80/extent-37 promotions, and eight abrupt history
reversals at extent 11. That roster and launch path are implemented without changing `core/` or
`solver-cpu/`; history rows reuse the existing Phase 4 LK timeline evaluator and record the exact
event boundary and transition report. Focused Vitest passed five files / 20 tests in 2.53 seconds,
and both TypeScript projects passed. The one required exact `npm test` passed Rule 7, both
typechecks, 162/170 test files, and 2,516 tests with 72 skipped in 1,230.88 seconds. Its 14 failures
are solely the previously recorded Phase 10 missing ignored recovery-byte and stale frozen-identity
failures, which this science work does not repair or rerun. The
[first discovery campaign](plans/post-phase10-discovery-campaign.md) is complete. Phase 7 remains
a separate parallel product path and is not part of this science workstream.

Wave 2 is complete. The maker resumed scientific review and discovery on 2026-09-08; the active
plan now selects a finite cavity/seed/grid experiment with sparse spatial boundary observations.
The review distinguishes larger growth/domain from grid refinement and cycle-offset alignment from
physical-time matching. Phase 10 remains complete-negative, not a verdict that candidate crystal
mechanisms are exhausted. Its original launch is terminal from clean producer
`055458abe151ee9324da42f4752ca08ebc314d0f`. Its ignored completion record is
`out/post-phase10-followup/campaign-2026-09-03-wave2/followup-wave-2-complete.json`
(32,684 bytes / SHA-256
`745bd401e331434ed3bb582f7ac81d80a145a402694851db62254f228f06f92d`): the exact exit roster
contains 133 zero exits and one nonzero exit at actual maximum concurrency 32. The sole invalid
history row hit a positive-subnormal aggregate-boundary fixed-point residual of one binary64 ULP
after its scaled tolerances underflowed to zero. The pre-registered one-ULP floor and regression
landed in `60487f597061d7d6f9e452d01c40625ca79db401`; the selective rerun then exited zero and
reached extent 29 at cycle 488 with 13,403 attached cells, exact D6h symmetry, converged relaxation,
and zero integrity errors. Its retained `result.json` is 4,658 bytes / SHA-256
`a4936f86f2b11d8d4080936aa915430f91b1160b479541e4e08a61e8d457eb98`. Preserve the original
failed row. The combined Wave 2 record now has 134/134 admissible endpoints.

The deterministic 393,699-byte Wave 2 analysis at
`out/post-phase10-followup/campaign-2026-09-03-wave2-repair-v1/wave2-analysis.json` has SHA-256
`83dc597ad20dd58b913f1cbbc6cfd4eac0d63691057b16eae8d883776034f50a`. It strengthens five
implementation-level leads: a scale-persistent warm M1 axial cavity, positive M1/no-dip core-depth
contrasts at N80, strong seed-shape-by-arm memory with a sensitive crossover near -8 C,
forcing/growth-stage-dependent pressure interactions, and deterministic warm/cold path dependence.
The 20 mixed-map controls and several pressure endpoints resolve as trajectory/plateau sensitivity,
not stable endpoint laws. The active plan records the exact matched sequences, corrects the prior
N64 topology comparison to enforce equal plateau age, and states the claim limits. These findings
are exploratory model development, not physical validation or Phase 7/10 credit.

The adaptive first tranche is complete from clean producer head `0e55b7b`: 432/432 workers exited
0 at actual maximum concurrency 16, comprising 288 temperature/forcing rows, 72 pressure rows and
72 seed-shape rows. The ignored raw completion record is
`out/post-phase10-adaptive/campaign-2026-08-28/first-tranche-complete.json` (95,383 bytes / SHA-256
`4d798947bb13db0bf866e5e1941b7132a25ff72d110b3d2e42d4f59b7fbefb98`); the current row census
finds 432 admissible terminal results, zero inadmissible results and zero stderr bytes. Compact
analysis and evidence promotion are still in progress, so these retained `out/` bytes are not yet
published evidence. Maker direction expands the earlier 48-row follow-up cap: every plausible
pilot lead now receives longer matched evaluation, beginning with the complete 432-condition
roster at N64 / target extent 29. That finite long-wave roster and its `launch-long` route are now
implemented without a `core/`, `solver-cpu/`, checkpoint, or readout change. Focused Vitest passed
three files / 12 tests, `npx tsc --noEmit` passed, and Rule 7 is clean across 1,522 files. Exact
`npm test` was not run for this runner-only roster extension under Rule 6.

The N64/extent-29 long wave is complete from producer head `df757992`: its ignored census at
`out/post-phase10-long/long-wave-census-2026-09-02.json` (1,379 bytes / SHA-256
`2ddceacbdb582b21a4ba241c58fa1eecc0bed49cceb2b91311b58b67d13bf13e`) records 432 registered,
valid, unique size-target results, zero missing rows and one excluded earlier contact-stopped
duplicate among 433 result files. The active plan records the four retained lead families and the
pre-registered 58-row confirmation wave. A proposed additional 12 facet-hybrid rows were removed
before any launch: the exact full check showed that their implementation changed the Phase 9-frozen
permanent-control solver identity, and the existing coefficient override is explicitly test-only.
The final 58-row design leaves `core/` and `solver-cpu/` byte-unchanged. Rule 7, both typechecks,
the six focused roster/runner/Phase 9 files (35/35 tests), and `git diff --check` pass. The exact
suite on the rejected design passed 161/170 files and 2,511 tests; its two new Phase 9 readiness
failures caused the simplification, while the remaining failures were the already recorded Phase 10
missing ignored recovery bytes and stale frozen identities. They are not part of this science work.

The maker-directed [growth visual studies](plans/dendrite-visual-studies.md), including the
newer named catalogue, are complete on `fix/animation-queue-windows-spawn` in `snowflake-animation`.
`out/named-growth-studies/packaging.json` records 151 prepared/decoded replays, including all 99
newer named entries. The gallery now offers collection and shape filtering; direct recordings and composed
scenes share Ion Bloom, Timeglass, Two Views and Crystal Cast with explicit composition labels.
Focused tests, typecheck, Rule 7 and app build passed. The earlier production browser sweep records
604 view renders and no unexpected errors (`out/named-growth-studies/browser-smoke.json`).
Final camera/timing refinements passed 20 targeted live renders and the rebuilt-production
seek check (`final-browser-smoke.json` and `final-production.json` in that directory).
Exact source identities are in `app/data/named-growth-library.json`.
The subsequent gallery pass adds tracked Timeglass previews (`app/data/growth-previews/index.json`)
and the focused browsing checks in `out/growth-gallery/browser-smoke.json`; it does not repeat
the earlier renderer sweep. The plan's gallery follow-up records the current browsing UI.
The subsequent structural-rendering pass replaces the two retired treatments and records its
representative controls/render checks in `out/growth-structure/browser-smoke.json`.
The completed graphs/export follow-up adds recording-derived readouts and actual MP4 downloads;
its browser and required full-check records are in `out/growth-insights/` as named above.
The subsequent Three Views replacement and Cast centering use the representative product checks
in `out/three-views/`, followed by the retired moving camera checks in `out/branch-flight/` and
the current two-pane/cropping checks in `out/two-views/`;
the earlier catalogue-wide sweep predates these rendering changes.
No solver, scientific evidence, source acceptance or phase state changed.

[phase-6-science-first-completion.md](plans/phase-6-science-first-completion.md) is the completed Phase 6 record (see its Completion record).
[phase-8-measurement-corpus.md](plans/phase-8-measurement-corpus.md) and
[phase-8-what-is-real.md](plans/phase-8-what-is-real.md) are completed records; the
[Phase 9 execution plan](plans/phase-9-execution.md) is complete and its
[knowledge-baseline plan](plans/phase-9-knowledge-baseline.md) is a completed research input.
The older [proposed consumer plan](plans/phase-9-modular-physics-arms.md) is superseded design
history, not execution authority. Decisions 0046–0050 keep worktrees, processes, artifacts, claims,
and completion credit isolated.
[nas-asset-governance.md](plans/nas-asset-governance.md) is a completed infrastructure record; its
correction changes no phase claim or credit.

The [Phase 10 execution plan](plans/phase-10-evidence-verification-execution.md) is complete in its
isolated worktree. Its S0 governance checkpoint, S1 contract freeze, and S2 A-S classification
freeze are complete; the A-P bootstrap and A-S static lifecycle are implemented and independently
reviewed. The six-file terminal A-P PASS dependency, seven-file A-S PASS bundle, and eight-file A-I
structural PASS bundle are published, independently verified, and manifest-pinned. A-I's exact
three-input commit preserves the freeze ordering; its 14 payloads are terminal refusals and its NAS
state is `unavailable-refusal`, so B inherits no source-availability claim. Two post-commit
synthetic-clone fixture repairs change no production semantics; the focused evidence/A-I/C0/executor
set passes 46/46. Exact post-publication `npm test` then passed 138/138 files with 2,289 passed and
49 skipped in 907.19 seconds before checkpoint commit `689a95a`. C0/executor retains its reviewed
protocol and callable freeze. The lock-before-preflight repair snapshot's exact `npm test` passes
138/138 files with 2,290 passed and 49 skipped and entered commit `e9b7268`. The first exact C0
derive attempt retained a worker-exit-0, terminal-`complete` candidate but published nothing because
publisher-side revalidation incorrectly bypassed the strict protocol parser and expected two input
identities at the wrong schema level. That is an unpublished infrastructure failure, not an
interpreted scientific result; its byte-for-byte retained local v1 attempt record remains under
`out/`. The recorded hashes detect later drift but do not make ignored staging into evidence. B
remains unstarted; C0V had not started at that C0 checkpoint. The strict-parser repair received a
zero-blocker non-author review, passed exact
`npm test` across 138/138 files with 2,291 passed and 49 skipped in 919.33 seconds, and entered the
same-commit v3 C0 code freeze at `a6d62e6`. The
[Phase 10 candidate plan](plans/phase-10-closures-and-frontier.md) is completed decision support
and superseded for execution. It remains the design history for the selected and rejected packages,
not execution authority. C0 is durably complete at `b8e65f3`. S5 design selected independent
references for radial and moving controls and the registered preimplementation refusal for static.
S5a's protocols, successor schema registry, concrete schema contracts, packet supplements, and
reference/refusal-only tooling entered Git together at the science freeze. S5b then published and
manifest-pinned the radial reference, moving discrepancy refusal, and scoped static refusal without
running a solver or production-comparison implementation. The active plan records every
load-bearing byte identity, exact suite, incident, and zero-blocker non-author reviews. S6
implementation was frozen before any registered S6 command, attempt, solver, or output. Its first
v1 A-P run later failed before preflight on the
runtime-label defect and retained only the two exact stale locks. Recovery-v1 then passed A-P v2
preflight but stopped before worker `ready` on the Windows child-roster snapshot defect. The active
plan preserves both failed tuples, pins the passing v2 preflight with zero governed/scientific
credit, and freezes the bounded recovery-v2 successor with exact suite and one non-author audit
green. From that pushed freeze, A-P v3 passed `check`; its one `run` completed four governed worker
invocations but the parent refused on the v2-to-v3 publication-path overlay before terminal
materialization. Recovery-v3 implemented the bounded lifecycle overlay and entered clean pushed
freeze `4286c61`; its exact v4 `check` wrote nothing and its one `run` completed four governed
invocations before finalization reused the immutable matrix path for the current v4 preflight.
No terminal artifact or credit was published. Recovery-v4 now reuses the exact resolver across all
current and historical finalization joins, pins the v4 preflight, and has exact `npm test` plus one
bounded non-author audit green. After its first-add checkpoint is clean and pushed, the active plan
authorized only the exact A-P v5 `check` and one v5 `run`. That run completed four governed
invocations, then final verification refused the control witness's conflated physical/semantic
digest before terminal publication. Recovery-v5 now centralizes the established no-LF semantic
digest, keeps physical identities separate, removes the masked historical baseline literal, pins
the v5 preflight, and exact-binds the complete predecessor state. Its clean pushed first-add freeze
is `d47b803`; the exact A-P v6 `check` wrote nothing and its one `run` completed successfully. The
six-file final bundle is terminal `complete`, independently audited, and manifest-pinned at 396
files / 6,242,500 bytes. Exact `npm test` passes 160/160 files with 2,512 passed and 49 skipped in
1,881.32 seconds. A-P v6 must not be retried. From pushed checkpoint `e092259`, moving-produce v1
passed its read-only check. Moving-produce v1 then fail-stopped before preflight/worker because the
reader compared A-P's valid
nine-file attempt against only its six internal files. The two retained locks
total 440 bytes and earn zero credit. Recovery-v6 implemented the exact nine-file roster,
historical recovery-v5 A-P reopening, and sole moving-produce v2 namespace; exact `npm test` passed
161/161 files with 2,516 passed and 49 skipped in 1,631.64 seconds, and a bounded non-author audit
found zero concrete blockers. Its pushed freeze is `e65ca44`. The v2 check passed without writes,
but its one run stopped immediately after locking because five active executor literals still named
moving v1. The two new locks total 440 bytes; no preflight, attempt, worker, or science ran. The
recovery-v7 successor unified the five sites behind one current moving-attempt authority, added a
real locked-dispatch regression, passed exact `npm test` and audit, and entered pushed freeze
`af72b00`. Its v3 check wrote nothing. Its one run then stopped during prior-A-P observation because
the observer's separate route-output classifier still used raw matrix paths. The two new locks
total 440 bytes; no preflight, attempt, worker, or science ran. The active plan records the bounded
recovery-v8 successor. Recovery-v8 mapped every selected prior-route output through the exact
matrix-to-live resolver and froze moving v4 alone. Its generated 18-JSON tree is deterministic at
SHA-256 `3fa94b67d2cc5ce1917d30a2e0f5679c2b96e2b4e90d690eccb24087db097763`; strict parsing and all
101 live callable bindings pass. Exact `npm test` passed 162/162 files with 2,520 passed and 49
skipped in 1,425.82 seconds. A fresh non-author audit independently rehashed the 64 retained files,
verified all 74 absences, all 101 live registrations, the six-output production observer join,
accounting, and ancestry, and reported zero blockers. Recovery-v8 entered pushed first-add freeze
`0abc4b5`. Its v4 check wrote nothing; its sole run completed the exact discrepancy caller without
a solver, then finalization rejected the immutable moving protocol path as though it needed writable
publication authority. The 54,825-byte passing preflight and eight ignored runtime files are
retained; the stop earns no packet, publication, science, or validation credit. Moving-produce
v1–v4 must not be retried.

The [compact gutcheck growth-replay plan](plans/explore-gutcheck-growth-volume.md) is the completed
local Journey/media implementation record; only governed NAS publication remains deferred. It is
parallel to, and cannot change, the Phase 6 lane.

The [glass/camera follow-up](plans/explore-gutcheck-growth-glass-camera.md) remains the active local
Journey presentation record; browser/visual acceptance is still pending.

The maker-directed [gut-check animation selection and queue plan](plans/gutcheck-animation-selection-queue.md)
is complete, including growth-event and full scientific output. The
[scientific-bundle NAS publication plan](plans/gutcheck-growth-scientific-nas-publication.md) is
also complete after the durable generated-cache copy, manifest registration, and exact repository
checks; it changes no phase status or scientific claim.
The maker-selected [named snow-crystal animation catalog plan](plans/named-crystal-animation-catalog.md)
is a completed product record in `C:/Users/HIL_ADMIN/Documents/GitHub/snowflake-named-catalog` on
branch `feature/named-crystal-catalog`. Its 99 accepted animations, final table, exact dual-output
bindings and real-browser Compose review are complete; no publication or cross-repository copy is
implied by that completion.
The maker-requested [local gallery plan](plans/named-crystal-local-gallery.md) is complete. Its
loopback-only 35-row visual catalog shows three cards per included type and click-to-play
direct/Compose web payloads. The service exposes only catalog/review-bound files and leaves Vite's
general `out/` denial intact; this is local presentation, not publication.
The maker rejected the first gallery player's visual quality after comparison with the existing GG
website. The completed [volume-rendered gallery plan](plans/named-crystal-volume-gallery.md) now uses
that showcase's strict decoder, arrival-volume texture and studio ice material for every card and
modal. Accepted records, identities, direct/Compose meaning and `<20 MB` payloads remain fixed. The
99-scene live-browser smoke passed 66 direct and 33 Compose scenes, including safe final framing and
shared-texture checks; the exact output is
`out/named-crystal-gallery-site/all-volume-smoke-final.log`. The generated-preview report at
`out/named-crystal-gallery-volume-previews/report.json` (19,066 bytes; SHA-256
`5a316187e3bae4f9ed25bd1083865cfb772bcfdaf82784665b0033f494b0dcc3`) binds all 99 current 720×720
volume-rendered card images.
The maker then rejected black, patchy and camera-jittering pinholes in the dense volume view. The
completed [volume stability correction](plans/named-crystal-volume-stability-correction.md) traced
them past a solid first-hit mask to the transmission pass: a coarse probe inside a later body could
have zero field gradient, so normalizing it emitted invalid black pixels that moved with the camera.
The shader now refines the actual far-side crossing, uses a safe fallback normal and smooths only its
shading stencil. The exact ten-capture review is bound by
`out/named-crystal-volume-stability/final-review/report.json` (6,614 bytes; SHA-256
`907d8aaca7cd95919cdbb2cc639fac5175b489512aa3215aadd1cace6ff00f4a`); all accepted products and
payload claims remain unchanged.
The active [render-worktree NAS closeout plan](plans/render-worktrees-nas-closeout.md) now governs
copy-only collection of generated named-catalog, animation, and primary-worktree output, durable NAS
publication, tracked discovery metadata, and a pull request. Merge, cross-machine restore testing,
and all cleanup remain maker-controlled later actions. It changes no catalog, renderer or scientific
result.

The old source-strata/ladder/WP3/R15 prerequisite sentence governed the now-closed Phase 6
production path. WP3 and R15 closed as not computed under decision 0045; that sentence does not
govern a future Phase 10 diagnostic. Any selected Phase 10 execution must instead freeze and pass
the package-specific prerequisites in its charter amendment and execution plan. Decisions
0043–0044's Phase 7 deferrals remain authoritative and cannot be discharged by Phase 10.

## Next step

### Science wave complete; consolidation pause — 2026-10-01

Both outstanding campaigns have finished, their comparisons are reviewed, and no experimental
workers remain. The [completed wave report](../evidence/post-phase10-wave-2026-10-01/README.md)
contains the findings, review limits, preservation inventory, and reproduction commands.
Sources are its cavity-comparison.json, history-t4p5.json and history-t5.json: all twenty
cavity/grid rows and all ten history rows have admissible size-target results and exit zero.
The final worker exit is 2026-10-01T11:38:09.276Z, recorded in the archived
cavity-fine-thick-t5-nodip/exit.json. These campaigns no longer prevent a machine restart.

The new lead is early-growth memory: both early-only rows retain fourteen original open planes
and add eighteen/twenty-two new surviving planes after switch-off, with 3.5 um further axial
tip advance and zero selected demand afterward. Late-only produces only 0.35 um terminal depth
despite appreciable exposure. The original M1 cavity contrast survives the measured grid/seed
changes, but the added waist remains four cells: 1.4 um coarse versus 0.7 um fine. The new
history rule has not been tested on a finer grid. Sources and common-age/size limits are in the
report; these are model-development results, with no physical-validation claim.

Three tracked run archives preserve 487 files / 324451935 source bytes, including these campaigns
and the eight prior width-comparison rows. Every member matched a fresh restore by length and
SHA-256; raw-inventory.json records the exact paths. No original local output was deleted.
The remaining science-output backup is now complete on NAS as
`post-phase10-science-output@2026-10-01`. The
[backup verification](nas-assets/manifests/post-phase10-science-output/2026-10-01-verification.json)
records all 10447 original files / 1889781104 bytes across the selected science folders,
packed into 15 payload files / 304047835 bytes. Final NAS hashes, a fresh packed restore and
every extracted member matched; catalogue-based `assets:verify --full` and
`assets:verify-restored` also passed. Restore commands and the exact included/excluded scope are
in the active plan's NAS backup section. Local originals, failed packing attempts and restore
staging remain. The maker has since authorized consolidation and closure after preservation;
that work is in progress under the local consolidation plan.

**Published (2026-10-01):** the maker explicitly approved public publication of the pending
science history, including generated simulation records and logs. The non-force command
`git push origin HEAD:refs/heads/explore/post-phase10-discovery` succeeded, advancing the
existing branch on `billatgameology/snowflake` from 0e55b7b to closure commit 5834e2b.
The approval blocker is resolved; the scientific work remains paused.

**Next action:** open the completed report and the closing section of
`docs/plans/post-phase10-adaptive-discovery.md`, then reconcile the three machines' intended
branches, local-only changes and remaining output ownership into one shared baseline.
Start with `git worktree list --porcelain` and `git branch -vv`; do not merge historical/retired
branches blindly. The 24-core PC and Mac's live state have not been inspected. The maker has now authorized local merge and closure under the consolidation plan;
the other machines' active branches remain untouched and no new experiment is being launched.

Retain the maker's pause before another long wave. A possible follow-up is a physically matched
grid/width and initialization test of the early-history lead. Use disjoint case groups and
separate outputs on the two PCs with a common recorded producer/runtime. This PC remains capped
at 28 workers; determine the second PC's runtime and available budget. The Mac owns story/website
work. Every future nontrivial campaign must demonstrate pause/resume on one representative row
and record its checkpoint cadence and resume command, or use short independently terminal stages.
Other scientific lead families remain open. No Phase 7 or C0V/S6 work is reopened.

The active plan retains the detailed earlier implementation, launch, failed-check and analysis
history. Those checkpoints are reproduction context, not instructions to relaunch completed work.

### Completed Phase 10 reproduction context

Phase 10 is complete-negative at clean pushed checkpoint `e2cca93`; reproduce it with
`node runner/src/main.ts gate10`. Phase 7 remains on hold and independently eligible; no E/F/H
proposal, C0V recovery, solver change, source expansion, or new phase starts automatically. The completed
[execution plan](plans/phase-10-evidence-verification-execution.md) is the detailed record.

The material below is completed Phase 10 reproduction context, not a live execution checklist.

Maker direction on 2026-08-24 stops recovery-v10 and every further automatic S6 moving recovery.
The incomplete 12-file recovery-v10 working diff was discarded before any freeze, test, registered
check, or run; no v6 tuple exists. Preserve every pushed authority, lock, attempt, preflight, and S5b
artifact byte-for-byte. S6 moving remains unresolved with zero packet/scientific credit. Decision
0054 and charter v1.30 now provide the maker-approved one-package closure while preserving that
exact state and credit. No recovery work resumes without explicit maker direction and new authority.

`b-acquisition` is terminal and pinned. It passes both registered checks with aggregate `refusal`:
five exact targets are rights-blocked and Zhao S2 is acquired-and-bound in the active private NAS
collection. Publication and fresh-restore verification both pass for one file / 9,040,679 bytes;
no source prune is authorized. All six finite branch packets and `b-aggregate` are terminal; the
aggregate passes 6/6 checks and grants no downstream authorization. Decision 0054 / charter v1.30
now close the preserved maker-terminated recovery-v9 state without S6 packet or scientific credit.
The pinned gate receipt passed flagless `node runner/src/main.ts gate10` once from clean
`e2cca93`. Do not repeat the exact suite unless closure code or evidence logic changes. Do not
resume a moving-recovery ladder, run broad search, inspect numeric media values, implement E/F/H,
or add another assurance framework without new maker selection.

The A-P PASS dependency is committed at `63ca13c`; A-S PASS is committed at `78c1875`. A-I's
observation/decision/review inputs are committed at `9fb2e1b`, and its eight-file structural PASS
bundle is now published and pinned. The active plan's S3 checkpoint records every input and output
identity plus the exact claim limits. The fixture-only repairs have a green 46/46 focused
evidence/A-I/C0/executor run; do not describe that focused result as exact `npm test`.

The A-P-pinned execution README remains byte-frozen and supplies the canonical executor grammar;
this live state and the active plan freeze the post-A-P attempt instantiations. The v1 attempt is
retained intact and unpublished after its infrastructure refusal; preserve it without reuse,
deletion, or mutation. The strict-parser repair/re-freeze checkpoint is committed at `a6d62e6`.
From clean head `4c914ac`, the following registered check and run executed the distinct v2 attempt
exactly once:

```text
node runner/src/phase10-executor.ts check --packet c0-derive --protocol research/phase10-execution-v1/packets/c0-derive/protocol.json --attempt c0-derive-20260821-v2
node runner/src/phase10-executor.ts run --packet c0-derive --protocol research/phase10-execution-v1/packets/c0-derive/protocol.json --attempt c0-derive-20260821-v2
```

Do not rerun or reuse either derive attempt. V2 published five content artifacts plus its preflight
and terminal receipt, 316,068 bytes total as pinned by the 378-file manifest snapshot in derive
checkpoint `b7b5e91`, 62,902 bytes / SHA-256 `c7b91208…fae3`, and received a zero-blocker
non-author review. The
[independent receipt](../evidence/phase10-numerical-verification-v1/c0-derive-verification.json),
16,782 bytes / SHA-256 `876a15a8…2188`, passes 8/8 checks and all 7/7 named controls; the
artifact-derived ladder result is nevertheless NO-PASS (`criterion`) at both spacings and overall.
The [analysis](../evidence/phase10-numerical-verification-v1/c0-analysis.json), 21,049 bytes /
SHA-256 `bfd247d5…bc72`, re-derives 80/80 rows and 64/64 pairings, with 36 passes and 28
attached-count criterion failures, and records the historical `some`/`every` verifier mismatch
without rewriting Phase 6. It executes no solver and grants no absolute-accuracy, robust-habit,
target-score, validation, or prior-phase claim.

The derive checkpoint is committed at `b7b5e91`. From that clean head, the following registered
check and run executed the dependent publish attempt exactly once:

```text
node runner/src/phase10-executor.ts check --packet c0-publish --protocol research/phase10-execution-v1/packets/c0-publish/protocol.json --attempt c0-publish-20260821-v1
node runner/src/phase10-executor.ts run --packet c0-publish --protocol research/phase10-execution-v1/packets/c0-publish/protocol.json --attempt c0-publish-20260821-v1
```

Do not rerun or reuse the publish attempt. Its artifact index, report, independent verification,
preflight, and terminal receipt total 25,903 bytes and received a zero-blocker non-author review.
The [publication verification](../evidence/phase10-numerical-verification-v1/c0-verification.json),
3,818 bytes / SHA-256 `f6114ce1…fa2f`, passes 5/5 checks; the [report](../evidence/phase10-numerical-verification-v1/c0-report.json),
7,657 bytes / SHA-256 `571e62ae…0b72`, remains `diagnostic-complete` with numerical NO-PASS
(`criterion`). Keep all 12 C0 files pinned in the 383-file / 5,300,224-byte evidence manifest
([`evidence/MANIFEST.json`](../evidence/MANIFEST.json), 63,752 bytes / SHA-256 `e220637c…c601`).
Exact post-publication `npm test` passed 138/138 files with 2,291 passed and 49 skipped in 900.63
seconds. The C0 publication checkpoint is committed at
`b8e65f39749f120e6d67d5549982f3d743626f68`.

S5a is complete at science freeze `cf0bd8b6ad12c79e38cb30ca0e50bcadab9cc6d9`. It freezes the
radial and moving independent-reference protocols, the static reference-refusal protocol, a
complete successor C0V schema registry and cycle-free schema-contract file, only the three
produce-packet supplements/registries, and reference/refusal-only generator and independent-check
code. The immutable
[C0V foundation](../research/phase10-c0v-foundation-v1.json), 19,412 bytes / SHA-256
`ddb842588fea19898f9f71a02ce461d5d32ec102b140798e5c62d175521157e8`, remains the governing
pre-value boundary. The [successor registry](../research/phase10-c0v-artifact-schema-registry-v1.json),
117,196 bytes / SHA-256 `d69af84af58af0aff1b5a6a307ef63094439891f0b79357c127035c483c6134d`,
promotes exactly 20 C0V reservations while retaining the four unrelated reservations; the
[schema contracts](../research/phase10-c0v-schema-contracts-v1.json), 93,575 bytes / SHA-256
`be743fbc560e46e60b51132be66ca9381ffa5d7b69bf6b1e21cce500628cf0f6`, define the promoted
contracts without changing the A-P-pinned original registry. The radial, moving, and static layer
protocol identities and every callable identity are listed in the active plan's S5a checkpoint.
No actual reference value, static refusal output, production-comparison implementation, C0V
attempt, or solver run exists at this boundary.

The initial pre-repair exact `npm test` passed 143/143 files with 2,332 passed and 49 skipped in
948.54 seconds. The first registered radial S5b derive then refused before creating an attempt or
output because raw `package-lock.json` bytes were LF in Git and CRLF in this clean Windows checkout.
The narrow EOL repair permits only reversible CRLF-to-LF equivalence for `package.json` and
`package-lock.json`; protocols, bindings, callables, and transitive local imports remain raw-byte
exact. Its synthetic regression proves the package bytes differ raw while their Git-filtered hashes
match, accepts that case, rejects a hidden substantive package mutation, and rejects the same EOL
mutation on a protocol. The repaired exact `npm test` then passed 143/143 files with 2,333 passed
and 49 skipped in 953.52 seconds, and the value-free science/code freeze was committed at
`cf0bd8b6ad12c79e38cb30ca0e50bcadab9cc6d9`.

A non-author OpenAI Codex GPT-5-family science reviewer with full shared context independently
rechecked the formulas, units, topology, ledgers, static public-API grounds, byte bindings, and
separation and reran the radial/moving-static/contracts command at 24/24; it reported zero blockers.
A separate non-author OpenAI Codex GPT-5 integration reviewer with full shared context reran the
five S5a suites at 41/41, obligation/progress at 22/22, typecheck, Rule 7, and diff checks and
reported zero blockers. Neither review derived a registered reference, ran a solver, opened Phase 6
inputs, or executed S5b/S6; the active plan preserves their complete Rule 10 limits.

The nine registered S5b commands ran from that clean head. They retained exact candidate/check
pairs under their registered attempt paths: radial 215,555 / 233,158 bytes with SHA-256
`9189038d0789cb77ac19266b8cc373fa7f25912d1842fd8e8ba03ff3a782fb9e` /
`d53401b2ae488b37528fbc4ea82616bc49d7b1ea87974caebcf3073a8cd22162`; moving 73,290 / 6,289
bytes with `89ebd7d39b843208c3cc804735fbcba96da7457cf9c667ff5a927a86a5776698` /
`e5477f6943b062501d172596fb8f4ac00409d6bc95728653635a0a47433b4396`; and static 8,536 / 4,189
bytes with `e6b1c3d4f27e3b451330026662baafb9a52e8742205eecb0be502a502fb84b34` /
`e7945d533d36c8a7a008e7af8eab2e62c8f47901e8d9cccf5a504b4ea361b334`. Radial checked PASS;
moving checked FAIL with the single artifact-recorded error `monotonicity/bracket/residual scalar
check failed`; static checked the scoped refusal. No solver or production implementation ran.

The first final wrappers were not valid evidence: the moving wrapper used the correct registered
reference path/schema and `reference-discrepancy-refusal` disposition, but copied the protocol's
success-only “independent-check agreement” claim into `claimBoundary.allowed`. Their exact unpinned
identities—radial 449,978 / `9c654673db42267bc3297bce0593f4ce8e655e275d3ce982d9362752c124dda4`,
moving 80,816 / `38c4b3c15fdc4b9a32a8fd0371d47485551c18bf33f6db4d33c70050fe86d4f6`,
and static 13,381 / `181b1bd3eb144d5ec44e180241be31dc273af0db9b82586d76f7b489bd98e084`—are retained under
`out/phase10-c0v-reference-v1/superseded/cf0bd8b6ad12c79e38cb30ca0e50bcadab9cc6d9/published/`.
They must never enter `evidence/MANIFEST.json`.

The value-inert claim-projection repair is committed at
`cd331b75be4527bab11f3139d968626914a87694`, the direct child of science freeze
`cf0bd8b6ad12c79e38cb30ca0e50bcadab9cc6d9`, with exactly the authorized five changed paths.
Every protocol, binding, generator, checker, shared parser, and non-publisher closure byte remains
raw-identical to the science freeze. Exact pre-publication `npm test` passed 143/143 files with
2,334 passed and 49 skipped in 963.10 seconds. From the clean child, only the three registered
publication commands reopened the retained candidate/check bytes; derive and check did not run
again.

The three reviewed S5b outputs are now pinned:

- [Radial reference](../evidence/phase10-numerical-verification-v1/c0v-radial-reference.json),
  449,978 bytes / SHA-256 `60800ae66160deedd96f21ecb982301546153057892e8fa68faa54b6251f31e2`,
  is `reference-frozen`; all four cases pass and the artifact-derived maximum generator/checker
  disagreement is `1.978373880025239e-15` against its frozen `1e-13` tolerance.
- [Moving reference](../evidence/phase10-numerical-verification-v1/c0v-moving-reference.json),
  81,026 bytes / SHA-256 `5419efd63ba03822159e573708637265ff6f09653e061ee7a4932e09f34e6386`,
  is `reference-discrepancy-refusal`. Topology, field, event, and ledger groups pass, but its scalar
  aggregate retains the sole error `monotonicity/bracket/residual scalar check failed`; the allowed
  claim records only the discrepancy with no reference or agreement credit.
- [Static refusal](../evidence/phase10-numerical-verification-v1/c0v-static-reference-refusal.json),
  13,381 bytes / SHA-256 `6e1e10c54f0262bcaf701996dfde52953b52afa9f9dc918b31daa1b680c179ea`,
  records scoped reason `current-contract-lacks-independent-static-spatial-reference-v1` with all
  six execution counters zero.

Together they add 544,385 bytes. [`evidence/MANIFEST.json`](../evidence/MANIFEST.json), 64,274
bytes / SHA-256 `78900f9a61db451ccf16ef2c703d6906504f0af36b2e16effd540248c92c13ee`,
now pins 386 files / 5,844,609 bytes. A non-author OpenAI Codex GPT-5-family science reviewer with
full shared context independently re-executed the radial formulas, moving topology/event/ledger and
binary64 checks, static source/API grounds, import independence, hashes, and freeze ancestry. A
separate non-author OpenAI Codex GPT-5 integration reviewer with full shared context re-executed the
production freeze inspector, strict/canonical parsing, binding/projection checks, manifest
arithmetic, and the 20/20 lifecycle/progress tests. Both reported zero blockers. Neither reviewer
ran derive/check/publish, a solver, S6, or full `npm test`, or opened Phase 6 inputs/evidence. The
generic envelope parser alone does not enforce claim/disposition linkage; exact publisher
projection, no-overwrite publication, manifest hashing, and required S6 byte matching are the
bounded protection.

The first post-pinning exact `npm test` correctly failed one stale S5a-era assertion that required
every S5b path to remain absent. The repaired schema-promotion test now pins the exact three selected
outputs, rejects the three unselected branches, and derives all 23 still-absent S6 evidence paths
from the frozen obligation matrix. On those stable bytes, exact `npm test` passed 143/143 files with
2,334 passed and 49 skipped in 954.36 seconds, including Rule 7 and both typechecks. The commit
containing this record is the S5b evidence freeze. S5b closes no produce packet and never runs a
solver.

The S5b moving result exposed a real mismatch between the approved live plan and the S1 machine
graph. The pinned moving artifact is a pre-production `reference-discrepancy-refusal`, so the plan
correctly forbids a solver, witness, numerical evaluator, and event-control campaign. Matrix v1,
however, has only independent-reference and preimplementation-refusal branches; its selected moving
branch still requires the forbidden witness/evaluation/check/control roster. Do not fabricate those
outputs or relabel the discrepancy as the static-only refusal route.

Decision [0053](decisions/0053-add-c0v-reference-discrepancy-route.md), charter v1.29, and the
active plan therefore add the missing third lifecycle outcome and concretize the already-authorized
prelaunch and registered-cap artifact/resource-refusal outcomes without changing the selected
scope, science protocols, values, tolerances, original matrix, or evidence. A validated failed
prelaunch condition closes with zero solver work; a separately validated registered-cap event may
close during production with its exact partial execution recorded. A crash, transport failure,
invalid negative-control campaign, or structural failure retains only immutable ignored raw state
and stale locks: v1 writes no terminal candidate, attempt row/ledger, verification, final receipt,
or credit, and a separately frozen successor is required before another attempt. Exit status alone
cannot select a scientific route. Commit this governance-only correction first. Then
implement and freeze a scoped
`research/phase10-c0v-s6-obligation-matrix-v1.json`, `research/phase10-execution-v2/`, supplemental
`a-p-c0v-s6`, dedicated C0V executor, match-only refusal routes, radial production/evaluation,
layer publication, and aggregate while every later attempt/output remains absent. The overlay must
derive radial/moving routing from the exact pinned S5 disposition: `reference-frozen` takes the
full production route, while `reference-discrepancy-refusal` takes match-only closure.

The first exact `npm test` on this governance checkpoint caught one stale historical fixture in
[`runner/test/phase10-scope-overlay.test.ts`](../runner/test/phase10-scope-overlay.test.ts): it had
substituted the later live charter for the exact raw v1.28 charter bytes bound by the A-S protocol.
The fixture now reconstructs the registered 107,284-byte / SHA-256
`fe621b3c22cab02a9386e36a0afd644a101245dc12c1849ce5691239461fb5e6` identity from immutable
charter commit `0c889c3423d87f9062555a058a320c4a5cce2bc5` and the historical mixed-line-ending map; it does
not repin A-S or weaken its checks. A non-author OpenAI Codex GPT-5 reviewer with full shared
context independently reproduced that tuple, reran the A-S 23/23 lifecycle, and reported zero
blockers with no solver, registered C0V, NAS/network, or Phase 6 evidence access. Exact `npm test`
then passed 143/143 files with 2,335 passed and 49 skipped in 981.82 seconds. Commit this
governance/test checkpoint before adding S6 implementation bytes.

S6 must byte-match the manifest-pinned S5b artifacts and may never regenerate or tune them. Radial
is the only current layer with a `reference-frozen` artifact that can authorize production if its
frozen artifact/resource preconditions pass; a registered in-run cap would remain resource refusal,
not numerical FAIL. Moving
must carry its discrepancy refusal and static its scoped refusal through match-only closure, with
no solver, witness, numerical evaluator, or numerical negative-control campaign for either
refusal. Do not run a C0V solver until the separate S6 implementation checkpoint has exact
`npm test`, a clean commit, and a zero-blocker non-author audit, followed by the committed
supplemental A-P PASS.
The static refusal is required
because the current contract supplies no admissible independent continuum field/flux reference,
expected spatial order, or justified order lower bound. The public one-sweep solver re-execution
path (not an execution-v2 attempt retry) can recover
the accepted final-sweep pre-call field, and a separate implementation can reconstruct the
post-smoother candidate; those routes support same-discrete implementation/stopping-error checks,
not the required independent spatial-accuracy reference. Tolerance-scaled self-convergence remains
forbidden.
The moving layer uses its predeclared single-site axial first-event fixture only as a tiny numerical
event control and grants no habit or physical claim. S6 may reopen and bind the committed
S5b bytes but may never regenerate or tune them. B remains independently eligible for its finite
packet work, but no C1–C5, target score, or habit row is authorized.

Maker direction on 2026-08-22 adds a prospective interaction rule to the active plan for any
separately authorized future model-change package. It is not an S8 deliverable: under decision
0052, S8 may still return only exact E/F/H scopes and budgets supported by B. A later approved
package may test a physically motivated A+B interaction even when an A-only or B-only arm is weak,
but only after the unchanged baseline, A-only, and B-only probes and under one frozen
baseline/A/B/A+B design at every load-bearing C5 corner. The interaction hypothesis, contrast,
parameter and fitting budget, required observable vector, numerical qualifications, failure
branch, and separate later confrontation evidence must all be fixed before deciding output is
inspected; already-inspected evidence remains development evidence. This rejects both post-result
combination search and the opposite mistake of assuming that weak single arms rule out genuine
coupling. It does not select a mechanism or authorize any solver change, combination run, C1–C5
row, or D/E/F/G/H execution in Phase 10, and it can take effect only in a separately
maker-authorized future package.

The A-S evidence preserves the Phase 8A status row/filter rule, immutable evidence roles, phase
ownership, Phase 8B's development/zero-held-out labels, cited classification reasons, and multiple
simultaneous blockers. It grants no quantitative eligibility, validation, held-out comparison, or
prior-phase credit. B and C0V retain their later protocol/reference freezes.

Standing constraints: no Phase 8 record may be relabeled unseen; Phase 7 retains held-out,
product, and GPU obligations; B outcomes do not automatically authorize E/F/H; the permanent
`GGThreshold`/`LibbrechtKinetics` operators remain unchanged unless a separately adopted package
explicitly amends their contract; and no Phase 6 evidence artifact is rewritten.

### Growth visual studies — ready to use

For integration status, open [PR #11](https://github.com/billatgameology/snowflake/pull/11): its
Tests check and merge record show publication. On macOS the dev server also needs the `/@fs` guard fix
from [PR #12](https://github.com/billatgameology/snowflake/pull/12) (branch `fix/vite-fs-guard-posix`,
fix commit `a7f2fbf`; the Current state entry above records the defect and checks). At maker direction
on 2026-09-09 the merged remote branches `feature/named-crystal-catalog` and
`fix/animation-queue-windows-spawn` were deleted with zero unique commits beyond `main`; the Windows
worktrees and their local branches remain the separately authorized cleanup pass in the closeout plan. The existing main failures are recorded above;
the maker's merge request proceeds on the verified unchanged failure set. Fetch `origin/main`; the viewing
instructions below apply to the integrated app. No further product implementation is planned.

Open `http://127.0.0.1:5191/dendrite-styles.html?browse=1` to see the thumbnail gallery. Search or
filter by shape/collection, then click a card to play it in the current view. Use **Browse
crystals** to reopen the gallery and **View** to select Timeglass or another treatment. The
**Named catalogue** filter shows the newer types and their variants. A fresh session can use
`npm run dev --workspace app -- --port 5191`. The [plan](plans/dendrite-visual-studies.md)
records the completed checks and source locations. No implementation work remains in this request.
The loopback dev server is recorded at `out/growth-gallery/dev-server.pid`; its logs are
beside it. Missing local source files remain visibly unavailable; the tracked original dendrite
remains usable. For already restored producer output, see `app/data/README.md` and
`GROWTH_STUDY_CATALOG_ROOT`. Timeglass is the default view.
For the new composition, start at `dendrite-styles.html?style=2&crystal=sweep-t1-sharp`.
**Two Views** shows the top view beside a closer three-quarter branch detail. Drag panes
independently, double-click to reset a pane, or adjust **Detail zoom**. **Crystal Cast** is centered
and retains **Move the light**. Open **Graphs** below any single animation to toggle attached sites,
new attachments and outward reach, or click a chart to scrub. **Export MP4** offers 720p/1080p,
10/20/30-second complete-growth clips and optional visible graphs. It retains the current
camera/rendering controls and restores playback after export. The plan's final follow-up records
the two-pane composition and closer detail checks; `app/data/README.md` has usage and browser requirements.

### Render-worktree NAS closeout — active

[PR #10](https://github.com/billatgameology/snowflake/pull/10) merged into `main` at `4cc1cb3` on
2026-09-04 with the tracked locator and owner manifest for `render-worktrees-closeout@2026-09-04`;
[PR #11](https://github.com/billatgameology/snowflake/pull/11) followed at `b9f0a0c` on 2026-09-06.
The Mac-side check on 2026-09-09 (Current state above) mounted the share, verified both owner
manifests, hash-verified a 414-file gallery subset against the manifest and started the full-hash
verify; the full restore below cannot run on that Mac (41 GiB free), so it still needs a host with
roughly 215 GB free or an external disk. The maker's remaining action is to attach the marked
`snowcrystal` NAS on such a host, then run:

```text
npm run assets:restore -- --collection render-worktrees-closeout@2026-09-04 --to out/restores/render-worktrees-closeout-2026-09-04
npm run assets:verify-restored -- --collection render-worktrees-closeout@2026-09-04 --from out/restores/render-worktrees-closeout-2026-09-04
npm run assets:restore -- --collection gutcheck-growth-scientific@2026-08-26 --to out/restores/gutcheck-growth-scientific-2026-08-26
npm run assets:verify-restored -- --collection gutcheck-growth-scientific@2026-08-26 --from out/restores/gutcheck-growth-scientific-2026-08-26
```

The first pair restores the new 130,479,382,836-byte closeout; the second restores the separately
owned 84,247,312,054-byte scientific tree that was deliberately not duplicated. Report both results
before any cleanup. Do not remove a worktree, delete a branch, or delete local output until the
maker explicitly confirms the cross-machine restore.

### Named snow-crystal catalog — complete

Work only in `C:/Users/HIL_ADMIN/Documents/GitHub/snowflake-named-catalog` on
`feature/named-crystal-catalog`; do not touch the running NAS publisher in the animation worktree.
The strict taxonomy, exact [52-asset visual audit](named-snow-crystal-current-assets.md), and
versioned GG+ seed implementation are complete in the isolated worktree. GG+ is a separate
initial-condition adapter: the permanent `gg-solver.ts` control remains byte-identical, while the
adapter's hexagonal-prism route matches its tested 200-tick state bit-for-bit. Strict custom sites
are connected, canonicalized, bounds-checked, and identity-bound by exact sorted-site digest.
A real four-site custom-seed growth sample round-tripped its web growth event file and full public
checkpoint. Focused seed/runner/control-identity tests passed 25/25. Exact `npm test` then passed
140/140 files, 2,237 tests with 49 skipped, in 440.00 seconds after setting `TEMP` and `TMP` to the
canonical long Windows temp path; the permanent G-G control identity passed inside that run.

The coverage-first command `node scripts/named-crystal-baseline-probes.ts run` then used exactly 24
workers and completed 24/24 direct-growth jobs. Its report is
`out/named-crystal-catalog/baseline-probes-v1/report.json` (40,380 bytes; SHA-256
`68221cc4190f4d28008dfc17c8fb0cf3cfa67347fc741ec4e13f9b767904ed3c`): web files ranged from
62,188 to 830,136 bytes, totalled 8,188,899 bytes, and all were strictly below 20,000,000 bytes.
The bound three-view review records ten advance candidates, five retune candidates and nine failed
probes, with zero formal slots filled. A presentation-only orthographic camera correction now
includes projected Z and full three-dimensional extent, so tall columns are no longer clipped into
vertical bars; its focused review/runner/framing checks passed 8/8, both typechecks passed, and the
app build transformed 73 modules. Next register one 24-job, one-driver-per-family follow-up across
the six failed GG+ hard forms (four deterministic variants each). That follow-up is now registered
in `docs/named-snow-crystal-hard-form-probes.json`: 24 unique jobs, four variants each for Scrolls
on Plates, Triangular Forms, Cups, Multiply Capped Columns, Needle Clusters and Hollow Plates. Its
runner independently binds those IDs to the failed first-pass review, materializes exact custom
sites/schedules, records exact argv and actual worker count, and enforces the same strict web
ceiling. The 24-job plan, connected-seed/schedule tests, both typechecks, Rule 7 scan and diff check
pass. Next run `node scripts/named-crystal-hard-form-probes.ts run` with exactly 24 independent
processes. That run completed 24/24 jobs with 24 actual workers; its 47,848-byte report (SHA-256
`21475d310edcc231fe1f5429d42684ac0bbb92f047c060acf7249570aa281ddf`) records web files from
34,549 to 507,663 bytes, 2,895,660 bytes total, all below the strict ceiling. Three-view review
advances the four Hollow Plates variants, sends Multiply Capped Columns and Needle Clusters to
explicit Compose, and sends Scrolls on Plates, Triangular Forms and Cups to one bounded early-stop
search because growth erased their defining seed feature. Zero formal slots are filled. Next
register the three-family, 24-job early-stop interval search before launching it on all 24 cores;
that manifest and runner are now complete. They derive one fixed source seed/spec for each family,
vary only stop tick across 100–1,200, record initial and newly attached site counts, and require 24
actual workers plus the strict web gate. Its 24-job plan, fixed-spec tests, both typechecks, Rule 7
scan and diff check pass. The run then completed 24/24 with 24 workers. Its 50,418-byte report
(SHA-256 `4b09087bbcf515f527bc8fa5e281b51f5be9661a86d53be61e564f41f7a74db3`) records positive growth
for every job and web assets from 4,105 to 53,312 bytes. Three-view review advances Scrolls on
Plates at 100/300/400 ticks, Triangular Forms at 200/400/600 ticks, and Cups at 100/200/400 ticks:
nine production candidates, still zero formal slots. Next bind the accepted direct-growth
production candidate matrix—including these nine and four Hollow Plates candidates. The versioned
Compose contract and live player are now also implemented: strict component/scientific identities,
transforms, phase offsets, bounds, unique cold-byte accounting, actual browser byte/hash checks and
an explicit composed-visualization disclosure. A deterministic crossed-needle smoke used one
121,806-byte growth request for two transformed instances and sought successfully at 4/8 seconds;
the three focused files passed 8/8, both typechecks and the 75-module app build passed. That local
probe is player evidence only, not an accepted scene. Next commit this contract, then build the
direct-growth production candidate matrix and first scientifically bound Compose baselines before
changing the two route decisions. The generated maker-facing catalog table now links all selected
early-stop/hollow-plate trios plus the Solid Column, Sheath, Split Plate and Isolated Bullet
baselines, and it names the two pending Compose transitions. Its strict validator and four focused
tests pass while correctly retaining zero accepted slots. Next register the dual-output production
matrix: exact lower/baseline/upper recipe identities for the new GG+ families and exact reuse
identities for current strong anchors, without inventing a scientific locator before the independent
publisher registers it. Do not touch the independently running NAS publisher in the animation
worktree.

The first production matrix completed 24/24 with 24 actual workers. The exact 567,085-byte report
(SHA-256 `ed3153cb3480180555c972ee07c0ec635111deb0773ed9bdcc1726e16dd4ef52`)
records decoder-verified web files from 4,759 to 361,488 bytes, 3,084,489 bytes total. The full
scientific inventory is 2,924 files / 2,291,163,313 bytes with 101–121 frames per entry. The bound
8,384,905-byte three-view contact sheet (SHA-256
`a77d447ecb0ca6b3f4f43de02007d165076f062aa6becbfc4c4ab3677e463346`)
supports acceptance of all eight lower/baseline/upper trios. The generated catalog table now links
each accepted preview, web asset, recipe and scientific bundle and reports 24 accepted / 75
remaining. Outputs remain local ignored products; governed publication is still pending and no NAS
locator is claimed.

The second 24-job protocol is now registered for Simple Prisms, Hexagonal Plates, Hollow Columns,
Stellar Plates, Capped Columns, Sectored Plates, Simple Needles and Fernlike Stellar Dendrites.
Every trio varies only one schedule-wide `rho` scale by ±5%. Six families derive from advance-grade
baseline materializations; Simple Prisms binds the strong `fig11` current-audit source, and
Hexagonal Plates binds the strong `sweep-t2p5-r0p08` source. The two plate families whose probes
contacted their domains use fixed enlarged domains. The exact manifest and runner are now
implemented and the read-only plan materializes all 24 jobs. It reuses the first tranche's
dual-output executor/verifier and refuses source review/hash, route, dimension, host/concurrency or
output-contract drift. The focused two-file check passes 11 tests; both TypeScript projects, the
Rule 7 scan and diff check pass. The implementation was committed as `8c13747`, then
`node scripts/named-crystal-direct-production-2.ts run` completed 24/24 with 24 actual workers. Its
594,644-byte report (SHA-256
`f5d30f6e896980a19df9716f5400c207c5c9994dce7fcd3804ec0c2ef97b85e1`) records decoder-verified
web files from 55,268 to 3,576,987 bytes and scientific bundles totalling 3,078 files /
6,568,205,710 bytes with 115–121 mesh states each. The 9,983,672-byte three-view sheet (SHA-256
`6e849aab1f49ed1e6e107516e42c27578ed6dee37a3d15e7abde5c92d3e6e578`) shows the eight expected
morphologies. Hollow Columns and Simple Needles retain 41–48 Z layers at their closest boundary;
Capped Columns retain 66–70. They are not vertically clipped.

Maker direction nevertheless requires the established large scientific domain scale: existing
planar sources are generally 500–800 cells across, Simple Needles/Hollow Columns are
128×128×768, and Capped Columns are 320×320×512. Therefore both completed 24-job fleets are retained
as parameter/morphology screens but do not complete final-resolution catalog slots. The active plan
now registers two replacement 24-worker fleets with exact large domains/caps and a vertical
clearance gate, while preserving the same three-variant recipes, 120-mesh-state scientific cadence,
actual web decoder and strict byte ceiling. Next commit that protocol revision; then implement the
tracked supersession/reset plus the common final-resolution runner and focused preflight before
launching Fleet A on all 24 cores. The protocol revision is committed as `e73d467`. The exact
36,250-byte supersession record (SHA-256
`7529a3c2ee754f24baf5515bb6b8631670a8423b14194f485dee4c789b080dbd`) now preserves both screens
and resets the strict catalog to 0 accepted / 99 remaining. The common manifest/runner materializes
24 unique source-bound jobs for either Fleet A or B, checks all registered large dimensions/caps,
and enforces both 16-layer and 5%-of-`nz` vertical clearance after generation. Its five focused
files pass 26 tests, both TypeScript projects pass, the Rule 7 scan is clean across 1,077 files and
the diff check passes; both final output roots remain absent. Next commit this implementation
checkpoint, then launch
`node scripts/named-crystal-final-resolution-production.ts run --fleet a` with all 24 workers. Do
not touch the independently completed NAS publisher in the animation worktree.

Fleet A is now running with 24 actual child processes and no early stderr. While it runs, the active
plan registers Fleet C for the final six direct-growth types: three exact-source `rho` variants each
for Columns on Plates, Skeletal Forms, Simple Stars, Stellar Dendrites and Double Plates, plus nine
fixed-recipe Capped Bullet stop candidates from which three adjacent bullet-and-cap results must
survive review. Implement and preflight Fleet C without launching it; Fleet A retains the only
24-worker production lane until it completes. Fleet C is now implemented as a separate byte-pinned
manifest/runner, its 24-job read-only plan leaves the output root absent, and its combined focused
check with the A/B runner passes 14 tests. Both TypeScript projects pass, the Rule 7 scan is clean
across 1,080 files, and the diff check passes. Commit this implementation without changing or
restarting Fleet A; Fleet C remains queued until the lane is free.

The final Compose protocol is also registered for 11 families / 33 scenes, including the deferred
Multiply Capped Columns and Needle Clusters route transitions. Every trio varies one small transform
property, counts unique component bytes, binds exact full-resolution component science identities,
and requires real-browser hash/decode/seek/render evidence. Implement its recipe manifest and
fail-closed builder while Fleet A runs, but do not materialize scenes or change routes until the
consolidated direct review exists.

The recipe manifest and fail-closed Compose builder are now implemented. A fixture consolidated
review exercised all 33 scenes through strict scene parsing, actual component decoding, unique cold
byte accounting and scientific-scene inventory generation; the three focused files pass nine tests,
both TypeScript projects pass, and the Rule 7 scan is clean across 1,083 files. The production plan
reports `directReviewReady: false` and leaves its output root absent as required. Commit this
checkpoint; do not build real scenes or change routes before direct acceptance.

The Compose browser-review helper is now implemented too. It requires the complete real 33-entry
report, rechecks scene identities and the cold-byte ceiling, and drives the app's strict
`growthScene` path through component fetch/hash/decode before capturing start / 55% / final time.
It will write 99 capture identities bound to the exact source report, but cannot itself accept or
change a catalog row. Its JavaScript syntax check passes, the Rule 7 scan is clean across 1,085
files, and the diff check passes. Commit this helper while Fleet A continues; do not run it before
direct acceptance and real Compose materialization.

Review found that those 99 captures cover three timeline stages but only one camera and therefore do
not yet discharge the separately registered three-view morphology gate. The correction is now
registered before implementation: add capture-only bounded growth-scene camera overrides and produce
face/oblique/axial × start/55%/final captures, 297 exact playback images in total. Update and test the
helper while Fleet A continues; do not use its current 99-image form as Compose acceptance evidence.

The Compose three-view correction is now implemented. Normal playback cannot apply review params;
capture mode bounds tilt/yaw, and the helper now writes 297 face/oblique/axial × start/55%/final
captures plus a bound final-time contact sheet. Eight focused tests, both TypeScript projects and the
76-module app build pass. The built-app smoke command loaded a strict in-memory scene through real
component fetch/hash/decode, rendered the axial override, proved normal playback ignored review
params and refused 91° capture tilt; its screenshot SHA-256 was
`7179d18e9f33958313bec382944557db902a612fda33d8dfc0aa3ccc27cd3d75`. Both review scripts pass
syntax checks, Rule 7 is clean across 1,090 files and the diff check passes. Commit the correction;
real capture remains blocked on direct acceptance and scene materialization.

The final Compose acceptance transaction is now registered before implementation. A future reviewed
decision must pin the exact 33-scene report, 297-capture browser review and final-time three-view
contact sheet, with one morphology rationale per Compose family. A fail-closed verifier will rehash
all scenes, scientific-scene bundles and 297 captures, reparse scenes, recompute cold bytes, then fill
the last 33 slots and apply the two deferred route changes in one catalog/table transaction. Implement
and fixture-test it while Fleet A continues; production decisions remain blocked on real direct
acceptance, scene materialization and visual review.

The fail-closed final Compose verifier is now implemented. It rechecks all 33 actual scene/science
products, recomputes cold bytes, rehashes all 297 captures, requires exact nine-view/stage coverage
per entry, and prepares the last 33 slots plus both deferred route changes before any tracked output
replacement. The catalog validator now permits only the empty 24/9 pending route state or the complete
22/11 terminal route state. Six acceptance fixtures plus four catalog tests pass, including report,
capture, coverage, cold-byte and premature-route controls; both TypeScript projects pass, Rule 7 is
clean across 1,092 files and the diff check passes. Commit the verifier; real decisions remain blocked
on direct acceptance, scene generation, 297-image capture and visual review.

The final direct-acceptance transaction is now registered before implementation. One future tracked
decision file must pin the exact A/B/C reports, three-view contact sheets and clearance reports,
record every morphology rationale, and choose exactly three adjacent Capped Bullets stops. A
fail-closed verifier will recheck all selected actual web/scientific identities and clearance rows,
then atomically produce the consolidated 22-family / 66-variant direct review and fill only the 66
direct catalog slots. Implement and fixture-test that verifier while Fleet A continues, but do not
create the production decision file or accept any row before all real outputs are visually reviewed.

The fail-closed direct-acceptance verifier is now implemented. It rechecks contained A/B/C artifact
identities, complete 24-worker reports, every selected decoder/web/scientific identity, all registered
clearance rows and Capped Bullets adjacency before preparing the consolidated review and 66-slot
catalog/table transaction. Five focused fixtures pass: one complete 66-slot transaction plus exact
report drift, non-adjacent Capped Bullets, selected web-byte drift and incomplete-clearance controls.
Both TypeScript projects pass, the Rule 7 scan is clean across 1,087 files, and the diff check passes.
Commit the verifier; its production decision/review inputs remain absent until A/B/C visual review.

Final-resolution Fleet A then completed 24/24 jobs with 24 actual workers and zero failed/missing.
Its exact 591,740-byte report (SHA-256
`3f2450ea36371ad66198004e5f66368d59eeccb0e2ac021b46b973a121aa1cfd`) records 24 decoder-verified
web files from 623,976 to 10,923,005 bytes, all strictly below 20,000,000 bytes, plus 3,043
scientific files / 42,323,811,889 bytes with 109–121 mesh states per entry. The exact 4,225-byte
vertical-clearance report (SHA-256
`8badf5ef28933e6f3247edff9938ac30fe0345b38839492ae3439a166615f456`) passes 9/9 tall results:
Hollow Columns retain 238–249 Z layers at the closer boundary, Capped Columns 106–121 and Simple
Needles 178–196. Visual inspection of the exact 10,913,625-byte three-view sheet (SHA-256
`66222f9f5a84edb1b0132f7d049319b519c199eefa1c4f85f35af40a2572fcdf`) accepts all eight trios as
production candidates: planar forms retain their named face morphology, Hollow Columns/Needles are
axial and fully framed, and Capped Columns keep distinct caps at both ends. These 24 outputs remain
unaccepted until the consolidated A/B/C direct decision. Next commit this execution/review record,
then run `node scripts/named-crystal-final-resolution-production.ts run --fleet b` in the freed
24-worker lane; do not launch Fleet C concurrently.

Final-resolution Fleet B then completed 24/24 jobs with 24 actual workers and zero failed/missing.
Its exact 568,078-byte report (SHA-256
`51c23843bcbb0953d07fcd4ad0fe2d8734ee07b3c7a73e130fea713c5b8a97fe`) records 24 decoder-verified
web files from 4,769 to 444,686 bytes, all strictly below 20,000,000 bytes, plus 2,924 scientific
files / 12,489,068,672 bytes with 101–121 mesh states per entry. The exact 5,342-byte clearance
report (SHA-256 `0ce28de986c0424ea7adc2aabf720180ecfdccb7bfcdfaa8c78f062998235339`)
passes 12/12 tall results: Cups retain 246–250 Z layers at the closer boundary, Isolated Bullets
205–218, Sheaths 321–332 and Solid Columns 267–269. Visual inspection of the exact 8,666,417-byte
three-view sheet (SHA-256
`31dd77b506bf723dd110330e9497acc6c637286f061766b5ee172008b2386cae`) accepts all eight trios as
production candidates: the tall families are fully framed, Hollow Plates retain their cavity,
Scrolls remain asymmetric, Triangular Forms remain triangular and Split Plates & Stars remain
visibly split. These outputs remain unaccepted until the consolidated direct decision. Next commit
this record, then run `node scripts/named-crystal-final-resolution-production-c.ts run` in the freed
24-worker lane; do not start Compose generation concurrently.

Final-resolution Fleet C first pass then finished 21/24 with zero missing and 24 actual workers.
The exact 524,024-byte report (SHA-256
`84415852227cc635782358f5f2342173ff47edd9d2b910614a7a1b919e0d320e`) shows all nine Capped
Bullets searches and all Stellar Dendrites, Simple Stars and Skeletal Forms variants passed. The
exact 4,703-byte clearance report (SHA-256
`b368839ad836f358f83bedea994318bc686ba08078869a3e4ff7c880ba5067a0`) passes all 12 Columns on
Plates / Capped Bullets rows. Three child solvers exited zero and produced decoder-valid web files
below 20,000,000 bytes, but deterministic domain contact preceded their tick caps and left only
88/95/88 scientific frames: `columns-on-plates-upper` stopped at tick 10,251,
`double-plates-baseline` at 33,737 and `double-plates-upper` at 31,081. The active plan now registers
an exact three-job cadence-only repair at 86/282/260 ticks per frame, targeting 121 states while
requiring the final mesh/state/record/growth identities to remain byte-identical. Next implement and
focused-test the fail-closed repair/reconciliation tool, commit it, run the three jobs in parallel,
then render and inspect Fleet C's contact sheet. Do not weaken the 100-frame floor or change solver
recipes/domains.

The fail-closed cadence repair is now implemented. Its tracked manifest binds all first-pass and
unchanged-product identities; the runner derives exactly the three registered jobs, stages them in
a separate root, verifies 121-frame timelines plus byte-identical final mesh/checkpoint/record/web
products, archives the failed bundles, and reconciles the fleet without rewriting its original
24-worker launch. The read-only plan succeeds; the three focused files pass 13 tests; both
TypeScript projects, the Rule 7 scan (1,095 files) and diff check pass. Next commit this checkpoint,
then run `node scripts/named-crystal-final-resolution-c-cadence-repair.ts run`; the three independent
repairs use three actual workers because no other failed recipe exists to occupy the remaining
cores. After 3/3 completes, render and inspect Fleet C's three-view sheet.

The cadence repair generation completed 3/3 at exactly 121 frames each; the decoder-verified staged
web files are 1,599,644 / 5,877,133 / 6,214,328 bytes. Reconciliation then stopped before replacing
anything because the preregistered byte-identity assertion included `record.json` and
`growth-v1.bin`. Direct comparison proves every repaired final mesh and checkpoint is byte-identical.
The record differs only in generated paths, web byte count and wall time; strict decoding shows the
web event counts, seed counts, endpoints, dimensions, center, flat-index arrays and attach-tick
arrays are identical, while its provenance header records the different root and cadence argv. The
active plan now registers a correction: retain byte equality for mesh/checkpoint, require exact
field/event semantic equality for record/web, relocate only embedded root prefixes, and rebuild the
final inventory/status. Next implement and focused-test that correction, commit it, then rerun the
reconciliation stage without rerunning the completed solvers.

The correction is now implemented and product-sized verification passes: three focused files / 15
tests, both TypeScript projects, Rule 7 across 1,095 files and diff check. Exact mesh/checkpoint
identity remains mandatory; non-provenance record fields and both decoded attachment arrays now have
independent negative controls. The final-root files are re-decoded and recursively inventoried after
their embedded root prefixes are relocated. Next commit this correction and rerun the same repair
command; it must detect the complete 3/3 staged report, skip solver work, reconcile Fleet C and leave
the original failed bundles in the registered archive.

Fleet C is now complete and visually reviewed. Its exact 686,526-byte consolidated report (SHA-256
`0807b91d123516b4cbfc6d9be8306e8a1838b21f36e1f0e76d8363240e380490`) records 24/24,
decoder-verified web assets of 88,655–8,441,989 bytes, and 3,032 scientific files /
55,888,738,908 bytes with 102–121 frames. Clearance remains 12/12 in the exact 4,703-byte report
(SHA-256 `b368839ad836f358f83bedea994318bc686ba08078869a3e4ff7c880ba5067a0`). The exact 9,654,924-byte
three-view sheet (SHA-256
`4addc816196a172831df0702b7901d5f2028188076d8aaca1405672015cbee5d`) passes all five trios; Capped
Bullets stops 4,500/5,000/5,500 are the selected adjacent trio because each retains a tapered bullet
body and distinct plate cap. The exact three-fleet decision is now tracked. Next commit this review
and decision, then run `node scripts/named-crystal-final-direct-accept.ts` to fill 66 direct slots;
after its focused verification, build the 33 registered Compose scenes.

Final direct acceptance is complete: the exact 92,966-byte consolidated review (SHA-256
`31f5566114deae377d0a715bab2938b05750e5c6095a08e6144e6787023223ec`) binds 22 families / 66
variants, and the generated catalog is now 66 accepted / 33 remaining. Two focused tests had stale
0/99 fixture assumptions after the intended state transition; they now construct an explicit empty
direct fixture and assert the live 66/33 catalog. Both focused files pass nine tests, both TypeScript
projects pass, Rule 7 is clean across 1,097 files and diff check passes. Next commit this transaction,
then run `node scripts/named-crystal-final-compose.ts build`, capture all 297 real-browser review
images, inspect them and execute final Compose acceptance.

The first complete 297-capture Compose review is not accepted. Visual inspection found that the
fixed −500…500 scene cube makes several families tiny, while radial bullets/needles and crossed
needles overlap because their old Euler Z variation does not rotate the component's local Z axis in
the player's XYZ order. The active plan now registers exact event-derived transformed bounds, tested
polar-axis Euler rotations and high-visibility `bold-ice` review captures. Next commit this correction
protocol, implement it with focused geometry controls, rebuild the 33 scenes and replace all 297
review captures before creating any Compose decision.

The Compose framing/rotation correction is implemented. Exact decoded-event AABBs replace the fixed
cube; every transformed corner is checked against its published bounds; radial/crossed axes now use
a tested polar-to-XYZ mapping; and review switches to high-visibility `bold-ice`. Three focused files
pass 12 tests, both TypeScript projects pass, Rule 7 is clean across 1,097 files, JavaScript syntax
and diff checks pass. Next commit this implementation, rebuild the 33 scenes and regenerate the full
297-capture review before visual acceptance.

All 33 real Compose scene/scientific bundles are built. The first browser-review request stopped on
a Vite 403 before any scene rendered because the helper attempted raw `/@fs` access to `out/`, which
the app's security boundary intentionally denies. The boundary remains unchanged. The helper now
intercepts only the exact byte/SHA-verified scene and component URLs inside Playwright while serving
ordinary app code through loopback Vite; syntax, Rule 7 and diff checks pass. Next commit this helper
fix, rerun all 297 captures, then inspect the final-time three-view contact sheet.

The exact Playwright routes then reached and rendered the first real scene, but its first WebGPU
screenshot exceeded Playwright's unrelated 30-second capture default. The helper now gives scene
and contact-sheet screenshots the same 120-second ceiling already used for scene readiness. Next
commit this capture-only timeout and restart the browser review; no scene output or solver product
changed.

The corrected review reached 13/33 scenes before a second presentation defect was found and the run
was stopped: Multiply Capped Columns touches/crosses the viewport edge in oblique and axial views.
The transformed scene bounds themselves contain every component, but the orthographic fit omits
the yaw contribution from X and the final Compose `zoom` values below 1 shrink the calculated
half-span. The active plan now registers yaw-aware projected framing, a tall/yawed regression and a
minimum scene frame factor of 1. Next implement and focus-check that correction, rebuild the same 33
scenes, remove the partial rejected captures and restart all 297 views.

The yaw-aware projected-framing correction is implemented and focus-checked. Orthographic width and
height now include the actual yawed X/Y contributions, and final Compose scale-to-frame factors are
1 or 1.05 so the built-in 12% allowance remains positive. Fifteen focused tests pass, the root
typecheck covers both TypeScript projects, the app production build passes, Rule 7 is clean across
1,097 files and syntax/diff checks pass. Next commit the correction, rebuild all 33 scenes, remove
the rejected partial capture directory and restart the complete 297-view review.

That restarted review was stopped after six scenes because the first real face-on 12-branched Star
still reaches the top and bottom pixels despite the yaw-aware AABB fit. This partial capture set is
also rejected. The active plan now registers a conservative 1.4 scene frame factor plus a live
Three.js projected-cell rectangle that makes the browser harness fail unless every view retains 5%
clearance on all sides. Next implement/focus-check the rendered-clearance contract, rebuild the 33
scenes and validate the first flat and tall sentinels before continuing the full pass.

The rendered-clearance gate is implemented: full-growth decoded cells are projected through the
actual Three.js component/scene matrices and camera, and the review helper refuses a view outside
`-0.9..0.9` NDC before taking screenshots. Final Compose scenes use a conservative 1.4 frame factor.
Four focused files pass 16 tests, both TypeScript projects and the app production build pass, Rule 7
is clean across 1,097 files and syntax/diff checks pass. Next commit, rebuild, archive the rejected
partial review and restart with early flat/tall visual sentinels.

That final pass completed all 33 scenes / 297 captures with every live clearance check passing.
Flat and tall sentinels plus the complete contact sheet and representative seed/middle/final frames
passed visual review. The exact 45,797-byte Compose report (SHA-256
`d20832db1c7af49aaaae8e132b536e0298b8a992a11d9c5a25a1dc62a6513467`), 137,828-byte browser review
(SHA-256 `42b25f9177cdadd5ea7aa9931c3b2f74db0459c6bba9d0de1dd3422260d9d311`) and 5,243,676-byte contact
sheet (SHA-256 `0e2ea39dccb3fbf2b2c5bed4ef81ecf000670c1afbb80e999b76fe1397f47e59`) are bound by the tracked
decision and consolidated review. Final acceptance atomically filled the last 33 slots and changed
Multiply Capped Columns and Needle Clusters to Compose. The catalog is terminal at 99 accepted /
zero remaining, 22 direct / 11 Compose / two excluded; every cold web payload is below 20,000,000
bytes. Six focused files pass 26 tests, the root typecheck, app production build, Rule 7 across 1,099
files and diff check pass. This workstream has no remaining generation step. Publication or copying
these local products is a separate maker-authorized transaction if desired.

### Named snow-crystal local gallery — complete

The [local gallery plan](plans/named-crystal-local-gallery.md) completed the dedicated Vite page,
exact allowlist service and truthful direct/Compose playback distinction. Focused tests passed 2
files / 6 tests, both TypeScript projects typechecked, the app production build and Rule 7 passed,
and the live browser smoke covered the serving boundary plus one direct and one Compose playback.
No gallery implementation step remains. Public deployment or cross-repository copying would be a
separate maker-authorized transaction.

### Named snow-crystal volume rendering — complete

The [volume-rendered gallery plan](plans/named-crystal-volume-gallery.md) is complete. All 99 cards
now use matching final-frame previews and open the component-aware GG-style volume player. The
direct planar, tall/hollow and Compose sentinels passed visual inspection; the complete 66-direct /
33-Compose browser sweep passed framing, error and shared-texture assertions. Focused tests passed
three files / nine tests, both TypeScript projects typechecked, the app production build, Rule 7,
script syntax, diff check and the live gallery smoke passed. No solver, growth history, accepted
identity, scientific claim or network-payload ceiling changed. The loopback page remains
`http://127.0.0.1:5173/named-crystal-catalog.html`; public deployment is a separate transaction.

### Named snow-crystal volume stability correction — complete

The [volume stability correction](plans/named-crystal-volume-stability-correction.md) is complete.
The maker's exact 12-branched Star, its direct Simple Star source, two adjacent orbit frames, a
six-component Radiating Dendrite and thin/tall/hollow sentinels now render without the invalid black
pattern. All 99 previews were regenerated; the full browser sweep passed 66 direct / 33 Compose
players and the gallery smoke passed its serving boundary plus both playback routes. Focused tests,
both TypeScript projects, the app build, Rule 7, script syntax and diff checks pass. No solver output,
accepted identity, Compose transform, animation timing or network payload changed. The loopback page
remains `http://127.0.0.1:5173/named-crystal-catalog.html`.


### Other live decision points

1. **NAS prune approval** — the exact workstation-source prune list (pinned ladder worktree
   `G:\Code Files\snowflake-phase6-ladder`, archived `out/` trees) is now unblocked by the
   verified external-evidence backups; it remains a separate reviewed maker decision. Nothing
   has been deleted.
2. **Education reconciliation** — done and merged on 2026-09-05: Chapters 30–33 and the corrected
   Chapters 13–29 status boundary are on `main`, and the education verifier oracles
   (`docs/education/tools/part-two-oracles.mjs`) now pin the final Phase 6 state instead of the
   retired handoff. Still open: the exact `npm test` closure recorded in the education plan, and
   catching this index up with Chapters 30–33 when the Phase 10 evidence branch merges.

Phase 7 stays on hold as a parallel product/engineering track; it still requires its own
committed plan and isolated worktree before any work starts, and V4/V4.x apparatus stays
retired.

### Phase 6 closure record — no Phase 6 work remains

Closed 2026-08-20 on the flagless `gate6` exit 0 (gate table above; completed
[plan](plans/phase-6-science-first-completion.md)). The
[80-row ladder](plans/phase-6-wp2-ladder.md) published **NO-PASS (criterion)** on both
spacings — the numerics are NOT converged at these resolutions and the attached-count
observable carries multi-percent seed sensitivity — and the WP2 and gate-unit non-author
reviews closed with 0 blockers. A same-day macOS re-derivation at `9e64ef7` (clean tree)
reproduced gate6 13/13 / exit 0 and exact `TMPDIR=/private/tmp npm test` green: 132 files,
2,250 passed / 7 skipped in 403.61 s. Full closure detail:
[the history file](progress-history-phases-6-8-9.md). Held-out and preview-GPU work remain
Phase 7 property with no Phase 6 credit.

### Journey compact growth replay — glass/camera parity follow-up active (2026-08-16)

Open [explore-gutcheck-growth-glass-camera.md](plans/explore-gutcheck-growth-glass-camera.md), then
[explore-gutcheck-growth-volume.md](plans/explore-gutcheck-growth-volume.md). The strict format,
baker, full Run B asset, smooth viewer, measured comparison page, strict v5 Chromium record, visual
inspection, adversarial reviews and final full suite are complete locally. No Journey/media action is
required for those accepted v5 bytes. Hard-refresh
`http://127.0.0.1:4177/gutcheck-growth-comparison.html?record=%2Fcomparison-record.json` and inspect
poster views, final-state camera hold, orbit and `follow tour`. When Browser is available, add
presentation/camera/manual-hold witnesses to `app/scripts/growth-comparison-capture.mjs`, capture to
a new no-clobber directory, inspect the screenshots, then close the follow-up plan. Do not cite v5
for this look. Governed publication still waits for the parallel NAS-governance workstream's forward
collection command and catalogue/owner-manifest/receipt/fresh-restore contract. Do not run or
retarget `scripts/gutcheck-publish-growth-comparison.ts`, recreate the retired NAS `out/` tree, or
append the old ledger. Preserve the legacy meshes and do not count this media work toward any phase
gate.

### Phase 8B record — closed; external search remains stopped

Decision 0048, charter v1.25, and the
[benchmark-corpus plan](plans/phase-8-measurement-corpus.md) govern. Preserve `evidence/phase8-target-book/`
byte-for-byte, along with rejected plot-adjudication history and the failed original residual
audit. Broad discovery and the residual backlog remain stopped absent a new named
measurement gap; Phase 9 S0B is bounded reconciliation of already registered complete Git/NAS
sources. All 51 Phase 8B records are development evidence and none may be relabeled held out.

### NAS asset governance — complete through the Windows write lane; prune approval pending

The [governance plan](plans/nas-asset-governance.md) holds the full record: the macOS
correction applied without deletion (`d92f39a`), the Windows write lane executed 2026-08-20
(`0b34ee9`: 11 collections, 8,362 files, receipt-verified, 11/11 fresh-process full verifies,
green restore round-trip), and the external-evidence backup gap closed same day (`9e64ef7`:
independent-domain copies verified twice against ledger pins, `backup.status: verified`). SMB
rename crash-durability stays verification-based. Remaining: the maker's exact prune approval
(decision point 1 under **Other live decision points**). Quoted detail:
[the history file](progress-history-phases-6-8-9.md).
