# Progress — The Virtual Cloud Chamber

**This file is the compact, authoritative current-state index. Read it completely and leave it
true after every session that changes anything.** Rules: [AGENTS.md](../AGENTS.md). Governing spec:
[project charter.md](../project%20charter.md). The handoff mechanism is retired (maker direction
2026-08-20): this index plus the active plans are the sole live state, and work proceeds in
isolated worktrees per Rule 16.

## Historical record

The complete pre-compaction state and chronology through 2026-08-02 are preserved byte-for-byte in
[progress-history-through-2026-08-02.md](progress-history-through-2026-08-02.md). That snapshot is
historical, not current authority (its body is byte- and SHA-256-pinned by
`runner/test/progress-index.test.ts`). Open it only when this
index, a plan, ADR, or audit links to historical detail.

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
  test pin now enforces the tombstone. Phase 10 remains uncharted; the
  [Phase 10 draft](plans/phase-10-closures-and-frontier.md) carries a dated 2026-08-20
  reassessment against the landed Phase 6/8B/9 outcomes and awaits the maker's chartering
  decision (adoption requires an ADR plus charter amendment per Rule 5).
- **Assurance is proportional to decision risk.** [Decision 0049](decisions/0049-make-assurance-proportionate-to-decision-risk.md),
  charter v1.26 and `AGENTS.md` require integrity for routine sources, one targeted check for
  load-bearing inputs, and full named controls for gates or strong public claims. No recursive
  reviews; stop when another check cannot change the decision. No evidence or criteria changed.
- The maker's 2026-08-03 direction is recorded verbatim in the
  [completed Phase 6 plan](plans/phase-6-science-first-completion.md) and enacted by accepted decisions
  [0042](decisions/0042-bound-phase6-evidence-integrity-scope.md),
  [0043](decisions/0043-defer-incompatible-heldout-families.md), and
  [0044](decisions/0044-defer-phase6-preview-gpu-cohort.md) plus charter v1.21. The threat model is
  accidental error/crash/environment drift, with attacker-only local tamper closed as history; each
  unit gets one proportionate non-author review engagement. Held-out validation and the v6
  WGSL/preview-GPU cohort move to named Phase 7 work packages owned by `billatgameology`, with no
  Phase 6 credit. Decision 0045 later retained the three measured-only arms and budget-capped
  numerical ladder, but closed R15, the conservative-intersection headline, and the full production
  campaign as not computed.
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
  the published NO-PASS ladder verdict. The matched M1-versus-ablation pair shows agreement collapsing
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
- `crystallographicSpans()` reports exact integer `basalCaliper2`/`zLayers` (focused tests cover
  all D6 planar transforms and z reflection); not yet a reviewed source-to-model size mapping and
  no substitute for numerical controls.
- Proposed [ADR 0039](decisions/0039-cycle-boundary-lk-resume-checkpoints.md) keeps runner resume
  deferred until WP3 freezes it; production rows may not resume before acceptance.
- Education is frozen for Phase 6; the one maker-approved exception (`af7463b`, 2026-08-04) added
  the independent-laboratory record to chapters 4–13, `references.html`, and
  `FUTURE-ADDITIONS.md`. No other `docs/education/**` drift since `60e3f3f` (diff-verified
  2026-08-06); `8acf9fe` added proposed Phase 8–10 drafts. Decisions 0046/0050 adopted Phases 8–9
  without reopening education; Phase 10 remains uncharted and inactive. **Pages deploy retired
  2026-08-16 (maker direction):** `pages.yml` deleted, GitHub Pages disabled, content stays
  in-repo unpublished; `test.yml` CI unaffected.
- The gut-check exploration (`explore/gg-realism-gutcheck`) is MERGED to `main` (`98bc75d`,
  2026-08-12, merged-tree suite green); eyeball-only, not evidence, no solver code touched.
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
- **Last updated:** 2026-08-20 by Claude Fable 5 (post-closure reconciliation: handoff
  retirement, NAS write-lane fold-in, Phase 10 draft reassessment)

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

Before any production row, the repository must have reviewed source-derived physical-size strata, a
pre-registered and executed numerical-control ladder that selects one configuration or no-pass, an
accepted WP3 protocol freeze, and an independently reviewed artifact-derived R15 path. Decisions
0043–0044's deferrals are authoritative; they are verified records at WP8, not production inputs.

## Next step

### Live decision points (2026-08-20)

1. **Phase 10 chartering** — maker review of the
   [Phase 10 draft](plans/phase-10-closures-and-frontier.md), whose 2026-08-20 reassessment
   re-derives the options against the landed outcomes (scope-boundary-first; the Phase 9
   guide's observation-mapping/evidence-acquisition route; numerical convergence; closures
   deferred until their prerequisites exist). Until an ADR and charter amendment land,
   Phase 10 stays uncharted and no Phase 10 work starts.
2. **NAS prune approval** — the exact workstation-source prune list (pinned ladder worktree
   `G:\Code Files\snowflake-phase6-ladder`, archived `out/` trees) is now unblocked by the
   verified external-evidence backups; it remains a separate reviewed maker decision. Nothing
   has been deleted.
3. **Education reconciliation** — maker-directed, not started. The frozen education verifier
   oracles (`docs/education/tools/part-two-oracles.mjs`) pin superseded state-document
   content, including the retired handoff, so they are part of that reconciliation's scope.

Phase 7 stays on hold as a parallel product/engineering track; it still requires its own
committed plan and isolated worktree before any work starts, and V4/V4.x apparatus stays
retired.

### Phase 6 closure record — no Phase 6 work remains

The 80-row ladder (frozen plan, three-round pre-execution review, execution and
post-execution review records, all in [phase-6-wp2-ladder.md](plans/phase-6-wp2-ladder.md))
completed 2026-08-20 with **overall NO-PASS, class `criterion`, both spacings**. Quoted from
[`evidence/phase6-wp2-ladder/report.json`](../evidence/phase6-wp2-ladder/report.json)
(43,863 bytes, SHA-256 `fd20f701…ebb7`; bound [`rows.jsonl`](../evidence/phase6-wp2-ladder/rows.jsonl)
73,873 bytes, `c4fa70f7…cd14`): attached-cell counts exceeded the registered 0.5% agreement
at 5/16 coarse-domain, 6/16 fine-domain, and 17/32 auxiliary check points, with
seed-perturbation deltas reaching 9.285%; all 80 rows stopped `size-target` with 0
missing/unexpected/defects and exactly the three sanctioned heads. The numerics are published
as NOT converged at these resolutions; the S2-ceiling stratum stays UNVERIFIED; a pass would
have authorized no production (decision 0045). The WP2 non-author review confirmed the
verdict (0 blockers; all 28 failing comparisons re-derived to three decimals; verifier
suite-pinned at `app/scripts/phase6-wp2-ladder-independent.mjs`). WP8 executed same day: the
pinned [three-arm narrative](../evidence/phase6-three-arm-report/report.md), the flagless
`gate6` (`runner/src/gate6-aggregate.ts`) with 14 suite-pinned negative controls, the gate
unit's non-author review, exact `npm test`, and reconciliation; Phase 6 changed to complete
on the gate's exit 0, per the plan's WP8 rule. A same-day macOS re-derivation at `9e64ef7`
(clean tree) reproduced gate6 13/13 / exit 0 and exact `TMPDIR=/private/tmp npm test` green:
132 files, 2,250 passed / 7 skipped in 403.61 s. Held-out and preview-GPU work remain
Phase 7 property with no Phase 6 credit.

### Phase 8B record — closed; external search remains stopped

Decision 0048, charter v1.25, and the
[benchmark-corpus plan](plans/phase-8-measurement-corpus.md) govern. Preserve `evidence/phase8-target-book/`
byte-for-byte, along with rejected plot-adjudication history and the failed original residual
audit. Broad discovery and the residual backlog remain stopped absent a new named
measurement gap; Phase 9 S0B is bounded reconciliation of already registered complete Git/NAS
sources. All 51 Phase 8B records are development evidence and none may be relabeled held out.

### NAS asset governance — complete through the Windows write lane; prune approval pending

The [governance plan](plans/nas-asset-governance.md) holds the full record. `d92f39a` applied
the macOS correction without deletion (diagnostics 434 files / 666,233,360 bytes; quarantine
497 / 167,758,628; receipt `7de6caa2…220`). The Windows write lane executed 2026-08-20
(`0b34ee9`), quoted from the plan's apply record: 11 collections, 8,362 files, 2,774,126,334
bytes staged and promoted with three-way hash identity; receipt
`_control/receipts/migrations/windows-workspace-2026-08-20/result.json` (465,124 bytes,
SHA-256 `254d5b70…5c0f`); 11/11 fresh-process full verifies and a green restore round-trip;
the ledger owns 31,090 files / 471,637,028,713 bytes. The external-evidence backup gap closed
same day (`9e64ef7`): both external-evidence collections copied to an independent domain
(workstation C: drive), 37 files / 137,211,035 bytes verified twice against ledger pins, and
both catalogue entries now carry `backup.status: verified`. SMB rename crash-durability stays
verification-based (win32 cannot fsync a directory handle). Remaining: the maker's exact
prune approval (decision point 2 above).

Related record: two rejected D-BT candidates (10 files / 85,153 bytes) are preserved on NAS;
14 post-freeze payloads are logged in
[`phase9-post-freeze-source-intake-v1.json`](../research/phase9-post-freeze-source-intake-v1.json)
(unregistered, not evidence). The [CI repair](https://github.com/billatgameology/snowflake/pull/6)
merged green on Ubuntu. Phase 9 was not reopened.
