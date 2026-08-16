# Progress — The Virtual Cloud Chamber

**This file is the compact, authoritative current-state index. Read it completely and leave it
true after every session that changes anything.** Rules: [AGENTS.md](../AGENTS.md). Governing spec:
[project charter.md](../project%20charter.md). [HANDOFF.md](HANDOFF.md) is only the last
maker-triggered stop/restart snapshot and may predate this live index.

## Historical record

The complete pre-compaction state and chronology through 2026-08-02 are preserved byte-for-byte in
[progress-history-through-2026-08-02.md](progress-history-through-2026-08-02.md). That snapshot is
historical, not current authority. Its original body is 191,859 bytes with SHA-256
`2550319a3ac5d528c111875242419de91d2ed9b34f245f7a0364ede8b323f955`. Open it only when this
index, a plan, ADR, or audit links to historical detail.

## Current state

- **Phase 6 is ACTIVE AND INCOMPLETE.** The maker accepts the historical failure to reproduce the
  Nakaya diagram. Accepted decision
  [0045](decisions/0045-bound-phase6-closure-to-a-compute-week.md) and charter v1.22 (2026-08-06)
  bound the remaining work to a seven-wall-clock-day compute envelope: the numerical-control
  ladder executes budget-capped (no-pass first-class; a pass authorizes no production), ADR
  0026's conservative-intersection headline, R15's production path, and the full three-arm
  campaign close at measured-only grade (stated as not computed by decision 0045, never as
  satisfied), and a 204-point measured-only `M1_NO_DIP_ABLATION` sweep — arm-2-identical except
  `paramSet` — completes the three-arm baseline inside the envelope.
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
  standalone, unstarted and requires its own plan/worktree; Phase 10 remains uncharted.
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
  host, processes, artifacts, and unpublished verdict remain isolated. The
  [maker guide](phase9-model-development-guide.md) explains the data, methods, results, and next evidence.
- **The Phase 9 knowledge baseline is COMPLETE (research-only, 2026-08-12).** Its
  [report](../research/phase9-knowledge-sources.md), [guide](phase9-knowledge-guide.md), and
  [artifact](../evidence/phase9-knowledge-baseline-v1/report.json) (5,263 bytes; SHA-256
  `37c7aadf18bce7420883930f66d6c6a473100dd27e1468dd8396a3c1214b1f96`) preserve 18 sources and
  15 hypotheses. It is now a bound S0B input; no model ran during its construction.
- Phase 6's scoped decisions, host evidence, source lock, parameter correction, deferred resume,
  and review records live in the [active plan](plans/phase-6-science-first-completion.md) and its
  linked ADRs. Held-out and preview-GPU work remains Phase 7-only; R15, the headline, and production
  campaign remain not computed. Historical measured-only comparisons are **CAK 3/90, M1 54/90**;
  arm 3 is 5/90. Only matched M1 versus `M1_NO_DIP_ABLATION` isolates the implemented dip-factor
  change, and that contrast **cannot establish physical SDAK causality or necessity** in nature.
- Education remains frozen. Phase 6's Windows evidence host, processes, artifacts, and unpublished
  verdict remain isolated; Phases 8–9 did not reopen education, and Phase 10 remains uncharted.
- Snow Crystal Journey media proceeds in parallel. Transcript entries `JTS-M006`/`JTS-M007` record
  the one-long-documentary source, manga-like scroll story/autoplay export, and intent to continue
  through Phase 10. The versioned narrative score and fixed-frame export interpretation is recorded
  by plan commit `86fe656`; Chapter 1 remains the bounded pilot and scientific authority is unchanged.
- The maker-directed compact G-G growth replay is **IN PROGRESS** under
  [explore-gutcheck-growth-volume.md](plans/explore-gutcheck-growth-volume.md), committed before
  implementation as `7c60760`. It records exact attachment index/tick events in one sparse asset
  and renders a separately labeled smoothed implicit surface; it changes no solver or phase
  authority or replace the immutable 701-mesh timeline. The pinned endpoint is 961,597 cells,
  occupancy SHA-256 `9c98fe41e5ea2f6b2020063218b37255877548bdeb49dadf4235a4cf039cf9f7`, with a measured
  593×593×17 / 23,912,132-byte R32UI crop. Codec, baker and viewer focused tests pass 34/34.
  Non-author Chromium/SwiftShader smoke passed exact seek/reverse pixels, raw-canvas playback,
  controls, framing, reduced motion, errors/requests and full allocation. Its 8,418-byte record is
  `out/gutcheck-growth-smoke/browser-r32-runb-probe-v6/record.json`, SHA-256
  `c9e3250179a10ce334a61a5e6c49f7f6bcfc90988ef62c34f63d5e51fbbed17b`. The record stamps its
  61-event timing/image complexity NON-TRANSFERABLE to Run B. Review closed with no blocker/high
  code findings; exact `TMPDIR=/private/tmp npm test` passed and implementation commit `44fd4b6`
  landed. The restart-only full replay is running locally with the original Node v24.13.1 engine;
  its first `live.log` line measured tick 100/70,000, 37 events, elapsed 55.0 seconds.
- The gut-check exploration (`explore/gg-realism-gutcheck`) is MERGED to `main` (`98bc75d`,
  2026-08-12, merged-tree suite green). Eyeball-only — not evidence, no gate claim, no solver
  code touched.
- **WP1 size strata are FROZEN (2026-08-06).** `evidence/phase6-size-strata/strata.json` is
  18,867 bytes with SHA-256 `aba93698ad6dcd72237a9c7ffa48588143533db315c059a29f6cd98c8d0288b6`:
  S1 observed initial radius `[5.8999999999999995, 12.1]` µm (15 uncontested Harrison traces;
  `716d` echoed, flagged, excluded per the lock's unresolved-mismatch pin) and S2 grown
  mass-equivalent radius at 300 s `[9.472732790460505, 20.459585775743665]` µm (declared
  uniform-density closure; centrals are floors on half the true maximum dimension), plus warm
  anchor W1 and seven refusals. Frozen after a three-round non-author review ending CONFIRMED
  with 0 open blockers; provenance and limits (different-model status not established) are in
  [the WP1 plan](plans/phase-6-wp1-size-strata.md)'s Review record. Exact `npm.cmd test` on the
  frozen tree exited 0: Rule 7 clean over 436 files, both TypeScript projects, Vitest 82 files /
  1,454 tests in 628.68 s. Whether WP2 uses Z = 2 or Z = 1 strata is a WP2/WP3 protocol
  decision.
- **Last updated:** 2026-08-15 by OpenAI Codex

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
| 6 | **Active and incomplete** | The three measured-only arms and WP1 strata are published. The budget-capped ladder is executing; its verdict and WP8 gate remain. Headline/R15/campaign closed at measured-only grade; held-out/GPU execution deferred with no Phase 6 credit. |
| 7 | Not started; independently eligible | Charter v1.25 preserves Phase 7's independence but does not start it. A committed Phase 7 plan and isolated worktree are required; product, held-out validation, and v6 WGSL/preview-GPU parity remain its scope. |
| 8 | **Complete (8A + 8B)** | The immutable 8A book remains 18 entries / 59,019 bytes / SHA-256 `47a75f3f…71ec`. The verified 8B successor is 51 development records, 252,134 native rows and 431 plot points; no row is held out. [Completed plan](plans/phase-8-measurement-corpus.md). |
| 9 | **Complete (development-only)** | The all-no-pass branch closed: D-BT failed, M-F/M-K2 stayed mapping-dependent, controls/path-state/M-PK are unavailable or non-identifiable, and zero items promoted. Exact `TMPDIR=/private/tmp npm test` passed; no result grants validation credit. [Completed plan](plans/phase-9-execution.md). |

## Active plan

[phase-6-science-first-completion.md](plans/phase-6-science-first-completion.md) is the active Phase 6 authority.
[phase-8-measurement-corpus.md](plans/phase-8-measurement-corpus.md) and
[phase-8-what-is-real.md](plans/phase-8-what-is-real.md) are completed records; the
[Phase 9 execution plan](plans/phase-9-execution.md) is complete and its
[knowledge-baseline plan](plans/phase-9-knowledge-baseline.md) is a completed research input.
The older [proposed consumer plan](plans/phase-9-modular-physics-arms.md) is superseded design
history, not execution authority. Decisions 0046–0050 keep worktrees, processes, artifacts, claims,
and completion credit isolated.

The [compact gutcheck growth-replay plan](plans/explore-gutcheck-growth-volume.md) is the active
Journey/media implementation record. It is parallel to, and cannot change, the Phase 6 lane.

Before any production row, the repository must have reviewed source-derived physical-size strata, a
pre-registered and executed numerical-control ladder that selects one configuration or no-pass, an
accepted WP3 protocol freeze, and an independently reviewed artifact-derived R15 path. Decisions
0043–0044's deferrals are authoritative; they are verified records at WP8, not production inputs.

## Next step

### Current resume point — the ladder is EXECUTING; evaluate and close when it lands

The 80-row ladder (frozen plan + three-round pre-execution review, all in
[phase-6-wp2-ladder.md](plans/phase-6-wp2-ladder.md)) is running unattended from the pinned
worktree `G:\Code Files\snowflake-phase6-ladder` at operative head `3827b77` (three sanctioned
heads `f59d187`/`aa81295`/`3827b77`; no wall caps — the maker directed no arbitrary time stops).
Resume after any interruption from that worktree ONLY, never this checkout:
`node app/scripts/phase6-wp2-ladder-run.mjs --concurrency 12` (recorded rows are skipped;
in-flight rows re-run). When 80/80 rows are recorded: (1) run
`node app/scripts/phase6-wp2-ladder-eval.mjs` on the complete artifact and publish rows +
report under `evidence/phase6-wp2-ladder/` with manifest entries and the PROGRESS verdict
record; (2) the WP2 unit's one non-author review (sub-unit A + Stage A closure + 0045 rescope
+ ladder verdict, independently re-derived); (3) WP8: flagless gate over the amended
obligations, the narrative three-arm report, negative controls, exact `npm test`, full
reconciliation — Phase 6 closes. Do not resume education or V4/V4.x apparatus. Held-out or
preview-GPU work may begin only as separately planned Phase 7 work in its own worktree; never run
it from the Phase 6 lane or count it toward Phase 6.

### Gutcheck/NAS relocation — landed and approved (2026-08-14)

`ffb3a5e` lands the 254-path relocation/hardening unit. Claude Fable 5 approved it with zero
blockers after 72/72 focused tests and reviewer exact `TMPDIR=/private/tmp npm test`: 1,722
passed / 7 skipped (`out/checks/npm-test-round3-review.log`, SHA-256 `2a90d0d5…b11d`). Windows
`S:/` and full NAS replay remain unexecuted; two deferred low findings are recorded in the plan.

### Journey compact growth replay — implementation in progress (2026-08-15)

Open [explore-gutcheck-growth-volume.md](plans/explore-gutcheck-growth-volume.md). The strict format,
baker, viewer, small asset, browser smoke, full allocation probe, and non-author review are complete.
Exact `TMPDIR=/private/tmp npm test` passed and `44fd4b6` committed the implementation. The one-
process, restart-only 70,000-tick bake is running under the original Run B Node v24.13.1/V8 engine.
Monitor `out/gutcheck-growth-runB/live.log`, `error.log`, and eventual `exit-status`; do not launch a
duplicate. On exit 0, independently decode/rehash/check endpoints, then make and rehash a no-clobber
NAS copy. Preserve the legacy meshes and do not count this media work toward any phase gate.

### Phase 8B record — closed; external search remains stopped

Decision 0048, charter v1.25, and the
[benchmark-corpus plan](plans/phase-8-measurement-corpus.md) govern. Preserve `evidence/phase8-target-book/`
byte-for-byte, along with rejected plot-adjudication history and the failed original residual
audit. Broad discovery and the residual backlog remain stopped absent a new named
measurement gap; Phase 9 S0B is bounded reconciliation of already registered complete Git/NAS
sources. All 51 Phase 8B records are development evidence and none may be relabeled held out.

### Phase 9/local-asset closeout — complete

Phase 9/gutcheck are merged; Phase 10 is uncharted. On 2026-08-15 local research and scratch moved
to the verified NAS archives in [local-assets.md](local-assets.md). Both were rehashed after rename
and passed extracted `diff -qr` before deletion. The primary has no ordinary untracked or ignored
paths. `explore/education-ch1-video` has its own worktree without an upstream or local payload;
preserve its concurrent tracked education edits and private transcript.
