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
- **Phase 10 is IN PROGRESS (selected 2026-08-21).** The maker accepted the candidate plan's
  recommended **A-S + A-I + B + C0 + C0V with packet-specific A-P** package. The separate C1–C5
  numerical qualification work, including the early attached-count/domain sentinel and every
  scientific habit row, is explicitly unselected. The active
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
  terminal publication. All 437,809 new bytes are retained. Recovery-v5 now implements the bounded
  digest split and active receipt-baseline repair, exact-binds all retained state, and has exact
  `npm test` plus one bounded non-author audit green with every v6 path absent.
- **Assurance is proportional to decision risk.** [Decision 0049](decisions/0049-make-assurance-proportionate-to-decision-risk.md),
  charter v1.26 and `AGENTS.md` require integrity for routine sources, one targeted check for
  load-bearing inputs, and full named controls for gates or strong public claims. No recursive
  reviews; stop when another check cannot change the decision. No evidence or criteria changed.
- Historical extent-21 artifacts remain valid measured-only comparisons: **CAK 3/90, M1 54/90**
  over their named scopes. They are not the registered conservative-intersection verdict, which
  decision 0045 closed as not computed.
- CAK→M1 is a confounded parameter-family comparison. Only matched M1 versus
  `M1_NO_DIP_ABLATION` may isolate the implemented dip factors' effect on this solver under the
  frozen configuration; it **cannot establish physical SDAK causality or necessity** in nature.
- Education is frozen with known-stale prose; the Pages deploy is retired (2026-08-16, maker
  direction) and content stays in-repo unpublished, `test.yml` CI unaffected. Reconciliation is
  a live decision point under **Next step**. Full freeze history:
  [the history file](progress-history-phases-6-8-9.md).
- **Last updated:** 2026-08-24 (bounded recovery-v5 successor implemented and audited; exact suite
  green; A-P v6 check/run next after the clean pushed first-add freeze)

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
| 10 | **In progress — A-P/A-S/A-I PASS; C0 packet PASS/complete with numerical criterion NO-PASS** | A-P, A-S, bounded structural A-I PASS evidence, and the complete C0 packet are published and pinned. C0 independently re-derived 80/80 rows and 64/64 comparisons: 36 passed and 28 failed the attached-count criterion, so both spacings and the authoritative all-spacings reduction are NO-PASS ([report](../evidence/phase10-numerical-verification-v1/c0-report.json), SHA-256 `571e62ae…0b72`). C0 executed no solver and grants no absolute-accuracy, habit-robustness, target-score, validation, or prior-phase credit. C0V S5b pins the radial reference, moving `reference-discrepancy-refusal`, and scoped static refusal. S6's v1 through v5 A-P tuples each fail-stopped on bounded infrastructure defects; all bytes are retained. The v3, v4, and v5 workers each completed four governed structural invocations but published no terminal packet and earn no science/success credit. Recovery-v5 is implemented and audited with all v6 paths absent at its first-add checkpoint; selection still includes no C1–C5 or habit rows. |

## Active plan

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

The [Phase 10 execution plan](plans/phase-10-evidence-verification-execution.md) is active in its
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
the v5 preflight, and exact-binds the complete predecessor state. Exact `npm test` and one bounded
non-author audit are green. After its first-add checkpoint is clean and pushed, the active plan
authorizes only the exact A-P v6 `check` and one v6 `run`; v5 must not be retried.

The old source-strata/ladder/WP3/R15 prerequisite sentence governed the now-closed Phase 6
production path. WP3 and R15 closed as not computed under decision 0045; that sentence does not
govern a future Phase 10 diagnostic. Any selected Phase 10 execution must instead freeze and pass
the package-specific prerequisites in its charter amendment and execution plan. Decisions
0043–0044's Phase 7 deferrals remain authoritative and cannot be discharged by Phase 10.

## Next step

### Phase 10 — check and execute supplemental S6 A-P v6 once

The maker selected **A-S + A-I + B + C0 + C0V with packet-specific A-P** on 2026-08-21. No
C1–C5 numerical-qualification or scientific habit row is part of this execution. The
[active plan](plans/phase-10-evidence-verification-execution.md) preserves the candidate plan's
done/stop rules, authority boundaries, finite source and compute budgets, and return-only handling
of candidate E/F/H branches.

The recovery-v4 A-P v5 tuple remains consumed and immutable. Recovery-v5 implements its bounded
repair, manifest-pins the retained preflight, and exact-binds every predecessor byte and absence.
Exact `npm test` passed 160/160 files with 2,512 passed and 49 skipped tests; one bounded non-author
audit found zero concrete blockers. Commit and push this first-add freeze, verify that its authority
derives that exact first-add commit, and confirm the recovery-v5 runtime root plus all v6 final/stage
paths remain absent. Then run only these registered commands in order:

```text
node runner/src/phase10-c0v-s6-executor.ts check --packet a-p-c0v-s6 --protocol research/phase10-execution-v2/recovery-v5/packets/a-p-c0v-s6/protocol.json --attempt a-p-c0v-s6-20260822-v6
node runner/src/phase10-c0v-s6-executor.ts run --packet a-p-c0v-s6 --protocol research/phase10-execution-v2/recovery-v5/packets/a-p-c0v-s6/protocol.json --attempt a-p-c0v-s6-20260822-v6
```

The `check` must exit 0 without writes before the one `run`. Do not delete or mutate predecessor
bytes or retry any consumed tuple automatically. On refusal, retain every byte and return to the
active plan; on success, independently verify and pin A-P before authorizing moving-produce.
This supersedes **Phase 10 — execute the supplemental C0V A-P packet**: neither its original v1
tuple nor the consumed v2/v3/v4/v5 tuples are authorized again.

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

### Other live decision points

1. **NAS prune approval** — the exact workstation-source prune list (pinned ladder worktree
   `G:\Code Files\snowflake-phase6-ladder`, archived `out/` trees) is now unblocked by the
   verified external-evidence backups; it remains a separate reviewed maker decision. Nothing
   has been deleted.
2. **Education reconciliation** — maker-directed, not started. The frozen education verifier
   oracles (`docs/education/tools/part-two-oracles.mjs`) pin superseded state-document
   content, including the retired handoff, so they are part of that reconciliation's scope.

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
