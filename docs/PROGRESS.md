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
- The maker's 2026-08-03 direction is recorded verbatim in the
  [active plan](plans/phase-6-science-first-completion.md) and enacted by accepted decisions
  [0042](decisions/0042-bound-phase6-evidence-integrity-scope.md),
  [0043](decisions/0043-defer-incompatible-heldout-families.md), and
  [0044](decisions/0044-defer-phase6-preview-gpu-cohort.md) plus charter v1.21. The threat model is
  accidental error/crash/environment drift, with attacker-only local tamper closed as history; each
  unit gets one proportionate non-author review engagement. Held-out validation and the v6
  WGSL/preview-GPU cohort move to named Phase 7 work packages owned by `billatgameology`, with no
  Phase 6 credit. CAK, M1, `M1_NO_DIP_ABLATION`, the numerical ladder, R15, and conservative
  intersection remain in full.
- [ADR 0041](decisions/0041-phase6-ryzen9-host.md) and charter v1.20 landed canonically in
  `1ff948c`. The manifest-covered [host observation](../evidence/phase6-host/observation-20260803T033028Z.json)
  is 3,051 bytes with SHA-256
  `a21e93a7433666981b1b347f5b88a03e8d4e75658e4e9c25a360aae120a055dd`: Node reports an AMD
  Ryzen 9 5900XT, 32 logical processors, and 68,603,244,544 physical-memory bytes; `nvidia-smi`
  reports the RTX 3080, 10,240 MiB, and driver 591.86. Historical Phase 5 and pre-upgrade Phase 6
  evidence keeps its Ryzen 7 provenance and stated host-binding limits. New evidence records actual
  host, runtime, process concurrency, command, and flags.
- Historical extent-21 artifacts remain valid measured-only comparisons: **CAK 3/90, M1 54/90**
  over their named scopes. They are not the registered conservative-intersection verdict. R15 still
  has no production caller or complete artifact-derived gate, and numerical adequacy is unproved.
- **The arm-3 sweep is EXECUTED and published (2026-08-07).** 204/204 points at the registered
  configuration, exit 0, execution head `6340429`, from the two-stage freeze `6d140bf`/`e209d98`
  (values hash `297927da…2db92e` gated). Quoted from
  `evidence/phase6-sweep-arm3/report.json` (1,365 bytes, SHA-256 `32d18a1d…`): headline **5/78
  arm-scope, 5/90 common denominator**, neutral 155, excluded 0, extent-fragile 24. All five
  headline agreements sit in the single-temperature plates-warm regime (5/6 at −2 °C; 0/72
  elsewhere in headline scope) — structurally like arm 1's 3/90. The bistable band records
  11/18 non-neutral rows, all plates; in that band the registered rule accepts either pure
  class, so any non-neutral row agrees by construction. Measured-only grade; the registered
  conservative-intersection headline is not computed (decision 0045); numerical adequacy is per
  the pending ladder verdict. The matched M1-versus-ablation pair shows agreement collapsing
  54/90 → 5/90 when only the two dip factors are replaced by one — an implementation-level
  contrast that cannot establish physical SDAK causality or necessity in nature. Points/diagram
  are manifested (244,610 / 30,634 bytes). The Rule 9 sibling verifier passes and is
  suite-pinned; the unit's non-author review returned **0 blockers** (its own 204-row
  recomputation matched every published number; ten hardening items recorded in
  [the arm-3 plan](plans/phase-6-arm3-sweep.md), four adopted).
- CAK→M1 is a confounded parameter-family comparison. Only matched M1 versus
  `M1_NO_DIP_ABLATION` may isolate the implemented dip factors' effect on this solver under the
  frozen configuration; it **cannot establish physical SDAK causality or necessity** in nature.
- [ADR 0040](decisions/0040-correct-phase6-coefficient-and-sdak-provenance.md) and charter v1.19
  govern the coefficient/provenance correction. The current LF-normalized parameter table is 50,464
  bytes with SHA-256 `c0b314b681146152207f061209a3097609e34a234b0027ed73faa427334c79e2`.
  Historical parameter/protocol hashes and both legacy manifest schemas remain untouched.
- The candidate source lock covers five files, 21 Harrison archive members, and all 16 reconciled
  levitation traces but remains `passEligible=false`. The audited incompatibility finding is that no
  current held-out family is apples-to-apples with the implemented geometry and transport physics;
  decision 0043 defers all four without calling that a pass. The amended
  [source-currency record](../research/phase6-source-currency.md) is 29,714 bytes with SHA-256
  `af045438ab2e4bb0de82aea4b289388d7d2c0448322298f7ecfe4ed21e5d2563`. No provider request, new
  import, TAX2 measurement, R15 row, GPU validation row, or production solver job ran.
- The V4/V4.x search-register, publisher, and eight-control batch apparatus is closed as rejected
  history. The isolated batch clone under `research/tmp/recovery/wp1-v42-control-execution-author/`
  remains untouched. Six exact root-side apparatus files were removed from the live test/source
  paths without changing their bytes and preserved at
  `research/tmp/recovery/wp1-v4x-root-apparatus-rejected-20260803/`. Exact register/catalog/finding
  bytes are tracked only under `research/rejected/phase6-wp1-v4x/` as non-authorizing history for
  the threat-model ADR. Do not resume or dispatch that apparatus.
- The offline `crystallographicSpans()` primitive reports exact integer `basalCaliper2` and
  `zLayers`; its existing focused tests cover all D6 planar transforms and z reflection. It is not
  yet a reviewed source-to-model size mapping and does not replace numerical controls.
- Proposed [ADR 0039](decisions/0039-cycle-boundary-lk-resume-checkpoints.md) has reviewed,
  implemented protocol-independent streaming and field-adopting float64 restore through `a1d540c`.
  Its runner generation/publication/retry/trace contract remains deferred until WP3 freezes exact
  campaign inputs; production rows may not use resume before acceptance.
- The minimum current planning count remains `612 × S × D × Z` rows (three arms × 204 points ×
  spacings × domains × physical-size strata). The illustrative three-spacing, three-domain,
  one-size matrix is 5,508 CPU rows; it is a feasibility count, not a frozen protocol.
- The redirected baseline's exact `npm.cmd test` exited 0 in 674.8 seconds (Rule 7: 425 files; both
  TypeScript projects; Vitest: 81 files / 1,446 tests in 666.70 seconds). The direction-amendment
  unit's single non-author review found one stale live held-out instruction; its bounded follow-up
  closed it with 0 blockers / 0 suggestions after exact quote coverage and focused checks. On the
  accepted v1.21 landing candidate, exact `npm.cmd test` exited 0 in 665.9 seconds: Rule 7 was clean
  over 428 files, both TypeScript projects passed, and Vitest passed 81 files / 1,446 tests in 657.56
  seconds. These are repository checks, not Phase 6 scientific evidence.
- Education is frozen for Phase 6 with one maker-directed exception already landed: commit
  `af7463b` (2026-08-04, maker-approved mid-pause) added the independent-laboratory record to
  chapters 4–13, `references.html`, and `FUTURE-ADDITIONS.md`. No other `docs/education/**` drift
  exists since `60e3f3f` (verified by diff 2026-08-06), and no further education work runs until
  Phase 6 closes. Commit `8acf9fe` (same session) added three **proposed, uncharted** Phase 8–10
  plan drafts; they are not adopted phases and none may start before Phase 6 WP8.
- Maker-directed pre-Phase-7 exploration branch `explore/gg-realism-gutcheck` (worktree
  `../snowflake-gutcheck-gg-realism`; plan `docs/plans/explore-gg-realism-gutcheck.md` exists on
  that branch only): grow a large noisy `GGThreshold` dendrite, extract a smooth level-set
  surface, render the ADR 0029 ice look, and eyeball it against the J0521r2p footage. Eyeball-only
  exploration — not evidence, no gate claim, touches no solver package, and may be discarded;
  merging is a separate maker decision. It does not alter Phase 6 work or its "only active
  implementation plan" status below. The former gut-check worktree content (extraction/render
  tooling, the paper-coverage sweep, the growth-timeline viewer, and `docs/social/`) landed on
  `origin/main` 2026-08-06 via PR #1 from `explore/social-content`; that branch is otherwise
  outside Phase 6 scope and this bullet's "not evidence, no gate claim" status is unchanged.
- The maker pushed `main` on 2026-08-06 (remote update 06:20:47 −0700; then `origin/main` = `af7463b`).
  On maker direction later that day, local `main` merged `origin/main` at `6599a2c` — the PR #1
  gut-check/social content plus its reconciliation merges, performed by Claude Sonnet 5 per their
  commit records — with one conflict, this section, resolved by keeping the newer Phase 6 state
  and adopting the exploration-branch bullet above. The remote touched only `docs/`, `scripts/`,
  and `app/` — no solver, evidence, `.gitattributes`, or charter files. On the merged tree (`4181724`), exact
  `npm.cmd test` exited 0: Rule 7 clean over 475 files, both TypeScript projects passed, Vitest
  83 files / 1,467 tests in 680.51 s; the maker-directed push of merged `main` executed
  2026-08-06. Preserve `research/tmp/` as useful local research context; durable generated
  science belongs under tracked `evidence/`.
- 2026-08-06 resume baseline: exact `npm.cmd test` at `af7463b` exited 0 in 803.16 s of Vitest
  (Rule 7 clean over 432 files; both TypeScript projects passed; 81 files / 1,446 tests). Same
  session author-side verification (Claude Fable 5, shared context — working checks, not a
  non-author review): all four pinned identities above recomputed and matched 4/4 (host
  observation, source-currency record, LF-normalized parameter table, progress-history body);
  worktree tracked-clean; education-drift and unpushed-range content checks passed.
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
- **Last updated:** 2026-08-07 by Claude Fable 5

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
| 6 | **Active and incomplete** | Historical CAK/M1 measurements retained; WP1 strata frozen. Decision 0045 bounds closure: budget-capped ladder, third-arm measured-only sweep, and WP8 gate remain; headline/R15/campaign closed at measured-only grade. Held-out/GPU execution deferred with no Phase 6 credit. |
| 7 | Not started | Begins only after Phase 6 closes; charter v1.21 assigns held-out validation and v6 WGSL/preview-GPU parity to `billatgameology` here. |

## Active plan

[phase-6-science-first-completion.md](plans/phase-6-science-first-completion.md) is the only active
implementation plan. The detailed V4/V4.x chronology remains in the closed
[WP1 history](plans/phase-6-wp1-source-lineage-and-tax2.md) and recovery artifacts; it is not a live
schedule.

Before any production row, the repository must have reviewed source-derived physical-size strata, a
pre-registered and executed numerical-control ladder that selects one configuration or no-pass, an
accepted WP3 protocol freeze, and an independently reviewed artifact-derived R15 path. Decisions
0043–0044's deferrals are authoritative; they are verified records at WP8, not production inputs.

## Next step

### Current resume point — the ladder is EXECUTING; evaluate and close when it lands

The 80-row ladder (frozen plan + three-round pre-execution review, all in
[phase-6-wp2-ladder.md](plans/phase-6-wp2-ladder.md)) is running unattended from the pinned
worktree `G:Code Filessnowflake-phase6-ladder` at the operative amendment head `aa81295`
(two-phase heads sanctioned; 48 h runaway backstop only — the maker directed no arbitrary time
stops). Resume after any interruption: from that worktree,
`node app/scripts/phase6-wp2-ladder-run.mjs --concurrency 4` (recorded rows are skipped;
in-flight rows re-run; do NOT run from this checkout — the freeze/amendment heads live in the
worktree). When 80/80 rows are recorded: (1) run
`node app/scripts/phase6-wp2-ladder-eval.mjs` on the complete artifact and publish rows +
report under `evidence/phase6-wp2-ladder/` with manifest entries and the PROGRESS verdict
record; (2) the WP2 unit's one non-author review (sub-unit A + Stage A closure + 0045 rescope
+ ladder verdict, independently re-derived); (3) WP8: flagless gate over the amended
obligations, the narrative three-arm report, negative controls, exact `npm test`, full
reconciliation — Phase 6 closes. Do not resume education, V4/V4.x apparatus, held-out
execution, or preview-GPU work.
