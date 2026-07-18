# Plan — Phase 4 v2: reservoir-matched branch control and gate completion

- **Phase:** Phase 4 — The morphology gauntlet
- **Status:** in progress — criteria frozen; implementation pending
- **Started:** 2026-07-18
- **Last touched:** 2026-07-18 by Codex, coordinating session
- **V2 criteria freeze:** `9c9dd5a45eafb80f3e547298494f005a73d19086`

## Goal

Replace Phase 4 v1's infeasible cross-run extent dependency with decision 0012's matched
normalized reflecting-reservoir threshold/cadence/first-crossing rule, without changing any
morphology parameter or threshold.
Then implement and independently review the versioned protocol, rerun all controls, execute both
surface-operator passes, inspect real evidence, and close Phase 4 only if blocking Pass A is
earned. The live Phase 2b v4 process and its artifacts remain immutable and independent.

## Done when

Charter §3.2, Phase 4, verbatim at v2 registration (charter v1.10):

> Phase 4 — The morphology gauntlet (CPU solver, all diagnostics on). Run twice — once per
> SurfaceOperator implementation (amended v1.2; interface name synchronized after implementation
> audit). Pass A, under GGThreshold, certifies the machinery and the metrics: it proves the
> lattice, diffusion, and measurement pipeline can express and detect every target morphology,
> independent of any physics. Pass B, under LibbrechtKinetics, re-runs the gates with temperature
> as the swept axis — the project's first single-point Nakaya probes, and a cheap early warning,
> months before Phase 6, about whether the habit flip is in reach. Pass A is blocking; pass B is
> diagnostic (v1.3, decision 0005): a failed pass B is a reportable finding and does not block
> Phase 6 — Phase 6 is precisely the phase whose job is to report that failure properly.
>
> Solid column from the same solver — pass A: parameter change only; pass B: temperature change
> only. Done when aspect ratio inverts.
>
> Continuous, controllable plate↔column transition. Done when aspect ratio tracks the swept
> control across a stated interval — monotonic for pass A's abstract knob; for pass B, across a
> chosen temperature interval (e.g. −2 °C → −6 °C) where a single plate→column transition is
> expected.
>
> Facet-center vapor depletion clearly visible in the slice view on a widening column.
>
> Second scientific gate: hollowing emerges with no explicit hollow rule. Done when the
> hollowness metric rises from field dynamics alone, reproducibly across seeds.
>
> Conditions changing mid-growth: the timeline drives the real solver. Done when a
> **column→plate** history yields a capped column (direction corrected v1.9, decision 0011, to
> match G-G §XII and the intended geometry). Events are deterministic abrupt jumps; ramps are
> unsupported. A G-G event replaces registered parameter vectors while leaving `a`, `b`, and
> `d` bit-unchanged. An LK temperature event conserves interior absolute vapor number density by
> transforming each active unattached cell as
> `sigmaNew = (1 + sigmaOld)·cSat(oldT)/cSat(newT) − 1`; attached cells and inactive walls are
> excluded, and negative results are not clamped. The active Dirichlet shell is transformed too,
> then the next elliptic solve clamps it to the schedule's explicit `sigmaInfinity` and reports
> that reservoir exchange only as a numerical boundary diagnostic. Temperature-derived kinetics
> and conversion factors update atomically; cross-temperature demand bookkeeping uses each
> step's temperature rather than the final temperature for the whole history. Existing
> checkpoint meanings do not change; the schedule and event log accompany final-state evidence.
>
> Branching / dendritic growth at high supersaturation parameters. Under the reflecting G-G
> Pass-A experiment, the dendrite and its compact control each use the same normalized threshold
> `2*rho/3`, cadence, and first-observed-crossing rule; their actual normalized crossing values
> and geometric extents are separately reported outcomes, not equality or same-size claims
> (v1.10, decision 0012).

## Approach

### Authority and version boundary

Decision 0012 and this plan supersede the Phase 4 v1 A-BRANCH comparator stop and add only the
mechanical version separation, raw far-field witness, and explicit growth non-vacuity needed to
make that replacement fail closed. The
original plan remains the authoritative record for all unchanged Phase 4 criteria, implementation
history, reviews, evidence integrity rules, and the v1 failure. V1 remains immutable failed
history. V2 uses a new Pass-A manifest version/protocol identifier and requires the commit that
freezes this plan, decision 0012, the charter edit, and PROGRESS as an additional provenance
ancestor.

All v2 work occurs only on `main` in the current Windows root `G:\Code Files\snowflake`. Decision
0010's original Phase 4 worktree/branch was removed after maker-directed consolidation and is
historical. Its isolation rules remain live: `.tmp-gate2b-clean-1784305494`, PID 36792, and all
Phase 2b/Phase 3 evidence are read-only and may not be duplicated, interpreted as partial
evidence, or used to satisfy Phase 4.

No calibration run occurs in v2. Every v1 vector and numeric acceptance threshold remains frozen;
the first execution after reviewed implementation and preflight is the canonical v2 gate.

### Exact v2 delta

| Surface | V1 | V2 |
|---|---|---|
| Dendrite configuration | Published dendrite, only `rho=0.105`; `160,160,48`; seed 1; noise 0; hexPrism; reflecting | unchanged |
| Compact configuration | Exact published plate; same dimensions/domain/seed/noise/far field | unchanged |
| Dendrite stop | first observed `farFieldMean < 2*rho/3`, cadence 25, cap 12,000 | unchanged |
| Compact stop | first transverse-extent crossing inherited from dendrite | first observed `farFieldMean < 2*rho/3`, cadence 25, cap 12,000 |
| Dendrite morphology | `branchCount >= 6`, aspect ratio `< 0.3` | unchanged |
| Compact morphology | `branchCount = 0` | unchanged |
| Compact growth non-vacuity | implicit in crossing the dendrite-derived extent | explicit raw final occupancy beyond the canonical seed plus a reconstruction-proven nonempty delta cycle |
| Pass B | frozen 11-run diagnostic manifest | unchanged |

The v2 A-BRANCH record independently binds both final raw occupancies to:

- exact run configs and a shared dims/domain/seed/noise/far-field hash;
- `rho`, exact `2*rho/3` threshold, previous and crossing observation cycles/means, and
  `stopReason = far-field` for both runs;
- final transverse extents and independently recomputed branch counts;
- compact `finalAttachedCount > 19` from raw occupancy and
  `nonemptyAttachmentDeltaCycles >= 1` recomputed from the reconstruction-proven delta chain;
- successful shared execution validity, including mass, domain, symmetry, numeric, termination,
  source-hash, checkpoint, artifact, and provenance checks.

The dependent `tExtentFromRun` stop kind and `t-extent-target` stop reason are forbidden in a v2
manifest or report. The report states explicitly that extents are outcomes and the comparison is
not size matched. The implementation must not retain a dormant resolver that could make a v2
control depend on another run's result.

The two branch runs match the exact `2*rho/3` threshold formula, cadence 25, and first-observed-
crossing rule. Their actual normalized crossing means are recorded separately and are not
required to equal one another; cadence overshoot makes such equality unjustified.

### Raw far-field evidence

Every Pass-A run—not only the branch pair—adds one raw binary artifact
`runs/<runId>/far-field.f64le` with kind `phase4-far-field-f64le-v1`. It concatenates little-
endian float64 values in sample-major order for cycle 0 and every completed cycle divisible by
25 through the run's stop.

For hexPrism dims and the registered center, support indices are independently defined in
increasing flat-index order as active cells where either hex distance equals the inscribed radius
or absolute z offset equals the active half-extent. The scenario-v2 payload contains a nested
`farFieldWitness` object with exactly these keys and no others: `version`, `path`, `kind`,
`encoding`, `supportDefinition`, `supportCount`, `supportIndicesSha256`, `sampleCycles`,
`valuesPerSample`, `byteLength`, and `sha256`. Fixed literals are `version: 1`,
`kind: "phase4-far-field-f64le-v1"`, `encoding: "float64-le"`, and
`supportDefinition: "hex-prism-active-outer-shell-v1"`. `supportIndicesSha256` hashes the
increasing support indices encoded as little-endian int32; `sampleCycles` is the exact ordered
cycle array; the remaining values bind the named artifact and its byte shape/hash.

The verifier independently derives support from dims/domain/center, reconstructs occupancy at
each sample cycle from the canonical seed plus delta witnesses, excludes attached support cells,
and recomputes the ordered Neumaier-compensated mean from raw values. It requires bit identity
with every observed CSV scalar. It then derives the threshold from manifest `rho` and proves all
previous observations are at or above it, the first below-threshold observation is the recorded
crossing, and the stop reason/cycle agree. Size-target runs must contain no raw observed crossing
before their stop. No monotonicity assumption permits omitted observations.

### Exact wire and provenance identity

No version literal is left to implementation:

| Surface | Required identity |
|---|---|
| Pass-A manifest | `version: 2`; `protocol: "phase4-pass-a-v2"`; exact canonical SHA-256 pinned after implementation review |
| Pass-A report | generic evidence envelope `version: 1`, exact A v2 protocol/pass/operator; payload `version: 2` |
| Pass-A artifact index | generic index `version: 1`; existing descriptor kinds unchanged; exactly one new kind `phase4-far-field-f64le-v1` added |
| Pass-A scenario payload | `version: 2`; the v1 `resolvedTargetTExtent` member is absent, not retained as null |
| Pass-A delta payload and GG checkpoint | delta schema remains `version: 1`; checkpoint remains `gg-checkpoint-v1` |
| Pass-A far-field artifact | exact f64le artifact/kind/support/sample/metadata contract above; raw witness at cycle 0 and every cadence-25 observation |
| Aggregate | `version: 2`; `protocol: "phase4-aggregate-v2"`; explicit A v2 protocol/manifest-version/hash and B v1 protocol/manifest-version/hash |
| Pass B | manifest/report payload/index remain v1; exact protocol `phase4-pass-b-v1`; exact manifest SHA-256 `c0ceed5b0ebb68defee85b1d78d52c9563f5edd35ed415b8cfdad57dd7c3e812`; LK checkpoint remains v2 |
| App Pass A | real verifier, inspector, synthetic fixture, and source records require A manifest v2 / report-envelope v1 / payload v2 / protocol `phase4-pass-a-v2`; there is no A v1 compatibility branch |
| App Pass B | unchanged exact B v1 identity |
| Visual capture manifest | remains visual schema `version: 1`; Pass-A source protocol must be `phase4-pass-a-v2` |

Pass-A provenance keeps `criteriaFreezeIsAncestor`, `runnerFreezeIsAncestor`, and
`cadenceFreezeIsAncestor` bound respectively to `e567767`, `cd24365`, and `7be4c5d`, and adds
exactly `v2CriteriaFreezeIsAncestor` bound to the reviewed authority-freeze commit. The manifest
contains a four-element `criteriaFreezes` array in that order. Because a commit cannot contain
its own hash, the reviewed authority text is committed first; a metadata-only follow-up records
the full hash here and in PROGRESS without changing protocol criteria. Only then may implementation
start.

Pass B's provenance object remains the exact existing seven-key v1 shape (`node`, `v8`, `head`,
`trackedStatus`, and the three old ancestry booleans). Its collector must return an owned
projection rather than leak Pass A's added `v2CriteriaFreezeIsAncestor` key into B artifacts.
The aggregate takes the new ancestry fact from Pass A only. App verification likewise requires
the extra key for A and forbids it for B.

### Evidence and command contract

The flagless commands and output locations stay unchanged:

- `node runner/src/main.ts gate4a`
- `node runner/src/main.ts gate4b`
- `node runner/src/main.ts gate4`
- `out/phase4/pass-a`, `out/phase4/pass-b`, and `out/phase4/gate4-report.json`

`gate4` runs v2 Pass A first and starts Pass B only after valid blocking success. Pass B remains
diagnostic for morphology but blocking for execution integrity. Existing canonical output causes
fail-closed refusal. No canonical v1 Pass-A, Pass-B, or aggregate publication exists; the v1
failure log and non-evidence replay history remain immutable. Any injected or relabeled v1
manifest/report must be rejected by version, protocol, hash, criterion facts, or new freeze
ancestry.

Immediately before evidence, reconcile the live Phase 2b workstream. A scientific result alone is
linked as a higher-resolution reference and changes nothing. Any accepted code or contract fix is
integrated, reviewed, and causes all affected controls/evidence to rerun.

### Required adversarial controls

Before real evidence, tests must prove at least:

- v1 manifest bytes, manifest version/protocol, report-envelope protocol, report payload version,
  scenario version/dependent target fields, aggregate version/protocol/pass identities, app
  identity, and `t-extent-target` report facts each fail closed;
- shifting either branch run away from `farField`, cadence 25, or cap 12,000 fails config;
- wrong `rho`, threshold, previous/crossing cycle, previous/crossing mean, or stop reason fails
  termination or A-BRANCH independently rather than agreeing with a forged report;
- dropping, truncating, reordering, duplicating, or noncanonically encoding a raw far-field
  artifact/sample fails; wrong support geometry/index hash, sample cycle, occupancy exclusion,
  byte length, or compensated mean fails; a coherent CSV+crossing scalar rewrite with unchanged
  raw values fails;
- missing, extra, renamed, or mistyped `farFieldWitness` keys fail exact-key validation;
- a comparator with branch count nonzero, a dendrite below six, or a dendrite aspect ratio at or
  above 0.3 fails only A-BRANCH in isolated fixtures;
- a seed-only compact final occupancy and an all-empty compact delta chain each fail A-BRANCH;
  forged attached/delta counts that disagree with raw occupancy/rows/witnesses fail independent
  reconstruction before morphology evaluation;
- unequal shared dimensions/domain/seed/noise/far-field configuration fails A-BRANCH;
- different final transverse extents are accepted when all registered environmental and
  morphology facts pass, proving no hidden same-size dependency remains;
- a v2 execution commit missing any old freeze or the new v2 freeze fails provenance;
- Pass B remains byte/config identical to its frozen v1 manifest; aggregate publication, app
  verification/inspection/fixtures, and visual capture reject a v1 Pass-A bundle and accept only
  the exact matrix above;
- adding `v2CriteriaFreezeIsAncestor` to a B provenance payload, or omitting it from A, fails the
  corresponding exact-key verifier;
- every existing Phase 4 exploit/regression suite remains green.

### Serial work and review

The coordinator alone edits authority documents and commits. After the criteria freeze:

1. The developer changes only the bounded runner/core/app surfaces required by the exact delta and
   runs targeted plus full checks.
2. A distinct reviewer adversarially reviews the immutable candidate and reruns every new/old
   relevant exploit. Findings return to the same developer.
3. Fix, full retest, and same-reviewer cycles repeat until zero blockers and zero unaddressed
   should-fixes.
4. Only then may the coordinator run controls and real evidence.

## Steps

- [x] Independently review decision 0012, this plan, and charter v1.10; repair every blocker and
      should-fix before committing the criteria freeze. The independent protocol review closed
      CLEAN on 2026-07-18 with zero blockers and zero should-fixes after verifying the normalized
      reservoir rule, non-vacuous compact control, raw far-field witness, exact version/provenance
      matrix, immutable v1 history, unchanged Pass-B manifest, and verbatim charter gate.
- [x] Commit the reviewed authority criteria; freeze
      `9c9dd5a45eafb80f3e547298494f005a73d19086` defines the v2 authority and provenance hash.
- [x] In this metadata-only follow-up, record the full freeze hash here and in PROGRESS, verify
      that no protocol criterion changed from the freeze, and only then permit implementation.
- [ ] Delegate the bounded v2 implementation; run targeted tests, exact root `npm test`, app
      build, Rule 7, both typechecks, and `git diff --check`.
- [ ] Complete separate adversarial implementation review/fix cycles to CLEAN.
- [ ] Reconcile Phase 2b and verify its live process/artifacts were not mutated or duplicated.
- [ ] On a tracked-clean execution commit, rerun the exact Phase 2a enforcing byte control,
      flagless `gate3`, full regressions, app build, and synthetic visual harnesses.
- [ ] Run `node runner/src/main.ts gate4` exactly once. Record exit status, runtime, engine,
      commit, both manifest hashes, every criterion value, stop, checkpoint, and artifact hash.
- [ ] If Pass A succeeds and Pass B is execution-valid, run the real Phase 4 visual harness;
      coordinator and independent reviewer inspect every capture at full resolution.
- [ ] Obtain a final independent whole-phase adversarial review with zero blockers and zero
      unaddressed should-fixes.
- [ ] Update this plan and PROGRESS with exact evidence. Mark Phase 4 complete only if blocking
      Pass A and all execution/visual integrity requirements are actually earned.

## Out of scope

- Changing solver physics, G-G/LK presets, morphology thresholds, caps, cadence, domain sizes,
  seeds, noise, surface policy, Pass-B temperatures, or convergence controls.
- Selecting any v2 value from the observed v1 extents 99 and 83.
- Reusing or relabeling v1 attempted output, running Pass B alone to bypass Pass A, or treating a
  Phase 2b result as Phase 4 evidence.
- GPU/Phase 5 work, Phase 6 validation, SDAK, alternate surface policies, ramps, checkpoint wire
  changes, or product-layer UI work.

## Tried and rejected

- **V1's live same-size comparator.** The compact reflecting run reached its ordinary far-field
  stop at extent 83 before the dendrite-derived target 99; the 12,000-cycle cap did not bind. The
  unchanged diagnostic classified an infeasible protocol, not a runner defect. Continuing past
  the registered stop would be a different protocol; no later-geometry claim is made.
- **Any fixed extent chosen after v1.** Rejected as outcome-fitted, even if it would make both
  recorded trajectories cross.
- **A cap increase.** Rejected because ordinary far-field depletion, not the cap, stopped the
  compact run.
- **Dirichlet for one or both branch runs.** Rejected because Pass A's control is the published
  reflecting G-G machinery, and mixing far-field experiments would invalidate comparison.
- **Equal cycle count.** Rejected because G-G ticks have no physical-time interpretation and the
  source already supplies a normalized reservoir stopping rule.
- **Dropping the compact control.** Rejected because it is the live negative control for the
  branch metric and evidence path.
- **Allowing seed-only branch count zero as the compact control.** Rejected as vacuous. V2
  requires final raw occupancy beyond the canonical seed plus a reconstruction-proven nonempty
  attachment cycle; it does not choose a morphology size from observed endpoints.

## Open questions

None. The maker authorized a separately versioned v2 on 2026-07-18. Any further scientific
protocol change requires another maker decision and freeze before execution.
