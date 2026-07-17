# Plan — Phase 4: morphology gauntlet, timeline semantics, and visual diagnostics

- **Phase:** Phase 4 — The morphology gauntlet
- **Status:** in progress — passing criteria frozen; WP0 CLEAN; WP1 round-1 fixes awaiting
  re-review
- **Started:** 2026-07-16
- **Last touched:** 2026-07-16 by Codex, coordinating session

## Goal

Run the CPU oracle through the complete morphology gauntlet with every diagnostic enabled and
with no screenshot standing in for evidence. Pass A uses the permanent `GGThreshold` control to
prove that the lattice, diffusion, timeline plumbing, visualization, and metrics can express and
detect plates, columns, a continuous habit transition, facet-center depletion, emergent
hollowing, capped columns, and dendritic branching. Pass B repeats the same questions with the
source-constrained `LibbrechtKinetics` policy and temperature as the habit control. Pass A is
blocking. Pass B's numerical and evidence integrity is blocking, but its morphology verdict is
diagnostic: a physically disappointing result is recorded, never tuned away.

This phase starts in a separate worktree while Phase 3's external testing and the pre-registered
Phase 2b v4 evidence run continue elsewhere. Before implementation, the accepted Phase 2b v4
branch is integrated without touching its running process or evidence, and a narrow overlap ADR
updates charter §3.2. The timeline direction and conserved-field semantics are also settled by
ADR before timeline code runs.

## Done when

Charter §3.2, Phase 4, verbatim at plan registration (charter v1.6 in this worktree; the accepted
Phase 2b branch advances only its surface-policy clauses to v1.7):

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
> Conditions changing mid-growth: the timeline drives the real solver. Done when a plate→column
> history yields a capped column. Requires the timeline-semantics decision first (v1.3, decision
> 0005 D5): changing temperature changes c_sat(T), so the conserved field, what the timeline
> controls mean (absolute vapor density vs σ relative to ice), jump-vs-ramp behavior, and how the
> interior field and far-field reservoir transform at segment boundaries must be written down
> before this milestone's runs mean anything.
>
> Branching / dendritic growth at high supersaturation parameters.

One source contradiction is deliberately not hidden: G–G §XII produces a capped column by
growing a column first and then switching to plate-promoting conditions. The quoted
"plate→column" direction cannot produce caps at the ends of an existing shaft. The timeline ADR
must correct the charter to **column→plate** while preserving its required outcome; no code is
written against the contradictory direction.

## Approach

### Orchestration and authority order

The workflow is criteria-first and serial:

1. Commit this plan, including every threshold and failure status below, before creating a
   development agent.
2. Integrate the accepted Phase 2b v4 commits into this worktree, preserving the newer Phase 3
   app and evidence records. Re-run the full suite and the Phase 2a byte control before Phase 4
   implementation.
3. Write the overlap ADR and timeline-semantics ADR; update the charter in the same commit. The
   overlap is narrow: other worktrees, processes, and `out/gate2b*` / `out/gate3*` evidence are
   immutable.
4. Delegate one bounded development work package at a time. After each, a different agent runs
   an adversarial review. Findings return to the package's developer; fix → full retest → same
   reviewer repeats until zero blockers and zero unaddressed should-fixes. Only then does the
   next package start.
5. Run Pass A. Any named Pass A or execution-integrity failure loops back to development and
   invalidates that attempted evidence run.
6. Run Pass B. Numerical, provenance, convergence, checkpoint, or runner failures loop back to
   development. A morphology miss is recorded as a diagnostic negative result and is never a
   reason to alter parameters, thresholds, SDAK, or timestep policy.
7. Generate captures from the actual evidence states, inspect every image at full resolution,
   and have a separate review agent inspect them too. Visual defects loop to the responsible UI
   package and regenerate the whole manifest.

The coordinator alone edits this plan, ADRs, charter, `docs/PROGRESS.md`, and commits. Agents
receive disjoint file territories and never change authority documents.

### Evidence commands and exit semantics

Phase 4 adds three flagless commands:

- `node runner/src/main.ts gate4a` — Pass A only. Exit 0 means every blocking criterion below
  passed. Any flag exits 2. Any criterion failure exits 1 by its stable name.
- `node runner/src/main.ts gate4b` — Pass B only. Exit 0 means every run was execution-valid and
  every morphology verdict was recorded. The report contains `diagnosticPass: true|false` per
  morphology item. A morphology miss does **not** change exit 0; invalid numerics, provenance,
  artifacts, or incomplete runs exit 1. Any flag exits 2.
- `node runner/src/main.ts gate4` — runs A then B and writes the aggregate report. Exit 0 means
  Pass A passed and Pass B was execution-valid, whether Pass B's morphology was positive or
  negative. It never converts a diagnostic negative into a software failure or a false success.

All commands print and record the exact commit, clean tracked-worktree status, Node/V8 engine,
surface policy, protocol constants, termination, and artifact hashes. The aggregate JSON report
is `out/phase4/gate4-report.json`; per-run CSV series and checkpoints live under
`out/phase4/pass-a/` and `out/phase4/pass-b/`. A report is accepted only if decoding and
independent field-bit comparison of every checkpoint succeeds. GG v1 checkpoint headers retain
their frozen eleven-key wire contract; Phase 4 series live in CSV/JSON, not silently in that
header.

### Shared metric conventions

Existing metrics remain authoritative:

- Extent triggers use integer occupied-cell lattice spans: `iExtent=iMax-iMin+1`, likewise for
  j/z; `tExtent=max(iExtent,jExtent)`, `zExtent=kExtent`, and
  `largestExtent=max(tExtent,zExtent)`. These are distinct from aspect ratio's Cartesian
  across-flats denominator. Widening criteria use this integer `tExtent`.
- Habit is `aspectRatio = z extent / T extent`; plate is `<= 1/1.5`, column is `>= 1.5`, and
  the interval between is neutral.
- Hollowing is `crossSectionHollowness`, the per-z-slice open-cavity fraction. An open tube must
  have `sealedVoidFraction = 0`; sealed voids are reported separately and never substituted.
- Dendritic branching is the existing mid-plane `branchCount`; a compact hexagon is 0 and the
  synthetic six-arm negative control is 6.
- Facet-center depletion uses the existing `centerRimDepletion` on the field immediately above
  the top basal facet. Under G-G the field is diffusive vapor mass `d` in unvalidated model
  units; under LK it is dimensionless supersaturation. Only their unitless center/rim ratio is
  compared.

One new pure metric is required for the timeline result:

`cappedColumnProfile(a, dims, center)` first builds the sorted integer z-layer list containing at
least one attached cell. A gap in that list makes the result undefined. For each layer it records
the maximum integer `hexDistance(i,j,centerI,centerJ)`. With `m` occupied layers, the closed trunk
window uses zero-based occupied-layer ranks from `ceil(0.25*(m-1))` through
`floor(0.75*(m-1))`, inclusive. The trunk radius is the ordinary sorted median of those radii;
for an even count it is the arithmetic mean of the two central values. Each cap window contains
exactly `ceil(0.20*m)` ranks from its respective end, and each cap radius is that window's
maximum. `capScore = min(bottomCap, topCap) / trunk`. It is undefined for fewer than five
occupied layers, an empty window, a z gap, or a zero-radius trunk. Tests independently recompute
it on asymmetric all-distinct fixtures; a uniform prism scores 1, a one-ended flange fails the
two-cap criterion, and a symmetric capped prism exceeds 1.

### Pass A — blocking `GGThreshold` protocol

Unless a criterion says otherwise, every Pass A run must pass these independently evaluated,
stable execution criteria:

- `A-EXEC-PROVENANCE`: Node `v24.13.1`, V8 `13.6.233.17-node.40`, float64 CPU oracle, tracked-
  clean 40-hex execution commit, and final criteria-freeze commit `e567767` is its ancestor.
- `A-EXEC-CONFIG`: canonical 19-site radius-2/thickness-1 seed, hexPrism domain, reflecting far
  field, seed 1 and noise 0 unless the named scenario overrides them, with every registered
  parameter and dimension equal to the manifest.
- `A-EXEC-SYMMETRY`: on noise-off runs, the seed, every nonempty per-tick attachment delta, and
  final full state are exactly D6h symmetric; final `symmetryError = 0`. This criterion does not
  apply to a registered noise-on ensemble, whose per-cell perturbations break D6h by design.
- `A-EXEC-NOISE`: on a registered noise-on run, the manifest names the exact epsilon, seed, and
  counter-PRNG stream. On the first cycle whose positive pre-relaxation `d` cells contain both
  PRNG outcomes, the runner snapshots the raw state and an independent G-G reference recomputes
  the complete noise-on diffusion/refusal pass and the zero-noise counterfactual. Actual post-
  relaxation `d` must be bit-identical to the noised reference, at least one active value must
  differ from the zero-noise counterfactual, and both outcomes must have been applied to positive
  inputs. A same-seed replay is bit-identical across `a`, `b`, and `d`. Symmetry is reported as a
  diagnostic with no threshold. All mass, domain, termination, and numeric criteria still apply.
- `A-EXEC-MASS`: `Sigma(b+d)` is finite and relative drift from the initial compensated sum is
  `< 1e-10` at every recorded sample and at termination.
- `A-EXEC-DOMAIN`: `domainContact` is false on every tick and at termination.
- `A-EXEC-TERMINATION`: the registered stop reason occurs before its cap. Size targets are
  measured on the first tick crossing the threshold; a simultaneous orbit may overshoot, but
  the actual extent is recorded and never backdated. Far-field scenarios must stop only when
  `farFieldMean < (2/3)*rho` is first observed on the registered check cadence.
- `A-EXEC-NUMERIC`: all recorded fields, ledgers, metrics, and stop values required by a
  criterion are present and finite; hashes are recomputed from raw arrays rather than trusted
  from the report.

#### A-HABIT — solid column and continuous transition

- Dims `64,64,128`, seed 1, target largest lattice extent 14, step cap 12,000.
- Start from the published `plate` preset. Sweep one and only one abstract columnarity control
  `u = [0, 0.25, 0.5, 0.75, 1]`, mapped to the basal G-G attachment threshold
  `ggThreshBeta(0,1) = 3 - 2u`, i.e. `[3, 2.5, 2, 1.5, 1]`. Every other scalar and vector slot
  is byte-identical across the five runs.
- `A-HABIT-GROWTH`: all five runs reach the target before another stop and remain valid.
- `A-HABIT-ENDPOINTS`: AR at `u=0` is `<= 0.3`; AR at `u=1` is `>= 1.5`.
- `A-HABIT-SOLID`: the `u=1` endpoint has `crossSectionHollowness = 0` and
  `sealedVoidFraction = 0`. A hollow open tube is a column by AR but fails this criterion.
- `A-HABIT-MONOTONE`: AR is strictly increasing at every consecutive `u` value. Equal adjacent
  values fail; no post-hoc tolerance or isotonic fit is allowed.

Calibration only, not gate evidence: after WP0 review proved that the original target-36
endpoint was hollow (`crossSectionHollowness = 0.1260`), a pre-feature coordinator probe at the
replacement target gave actual extent 15, AR `[0.0667, 0.2000, 0.3333, 0.7333, 1.6667]`, and
endpoint hollowness 0. The inline probe was not retained, so these are margins only and are not
citable as Phase 4 evidence.

#### A-DEPLETION — widening-column field signal

- Published `hollowColumn` preset, dims `64,64,128`, seed 1, noise 0.
- Sample at the first ticks crossing extents `[12,16,20,24,28,32,36]`; record the entire series.
- `A-DEPLETION-COLUMN`: final AR is `>= 1.5`.
- `A-DEPLETION-DEFINED`: all seven ratios are finite.
- `A-DEPLETION-WIDENING`: transverse extent is non-decreasing over the seven samples and the
  final value is at least the first value plus 4 lattice units.
- `A-DEPLETION-SIGNAL`: median ratio is `<= 0.85` and at least six of seven ratios are `< 1`.
- The visual capture at or after extent 32 must show the same depressed center in the vertical
  slice while the HUD prints the exact metric values from `@vcc/core`.

Calibration only: inherited-solver ratios were `[0.770, 0.925, 0.688, 0.668, 0.779, 0.771,
0.731]`; all seven were below 1, transverse extents were `[7,9,9,9,11,11,13]`, and final
hollowness was 0.105.

#### A-HOLLOW — second scientific gate, non-vacuous seed ensemble

- Published `hollowColumn`, dims `64,64,128`, target extent 36, seeds `[1,2,3]`.
- `noiseEpsilon = 0.001`. This is a registered **phenomenological stress ensemble**, Evidence =
  unvalidated, not a claim of G-G source-scale realism (the paper suggests order `1e-5`). Its
  purpose is to make the three PRNG streams affect the trajectory rather than cite an unused
  seed field.
- `A-HOLLOW-EACH`: every seed reaches the target validly, AR `>= 1.5`, initial hollowness 0,
  final `crossSectionHollowness >= 0.08`, rise from initial `>= 0.08`, and
  `sealedVoidFraction = 0`.
- `A-HOLLOW-NONVACUOUS`: at least two final occupancy hashes differ, proving the seed-dependent
  path ran. A second seed-1 replay must be field-bit-identical to its first run.
- `A-HOLLOW` uses `A-EXEC-NOISE`, not `A-EXEC-SYMMETRY`; the final symmetry error is reported
  without an acceptance threshold.
- `A-HOLLOW-STRUCTURAL`: Phase 4 introduces no center-, radius-, cavity-, or hollowness-driven
  branch in either solver. The gate imports metrics only after stepping; the reviewer checks
  the solver diff as part of this criterion.

Calibration only: seeds 1–3 produced AR `[3.364, 3.273, 2.846]` and hollowness
`[0.182, 0.181, 0.108]` at the target. Those values are not evidence.

#### A-TIMELINE — a real solver state crosses a source-cited environment change

- Dims `64,64,128`, seed 1, noise 0, reflecting far field.
- Segment 1 is the published `hollowColumn` preset. Immediately before the next tick after the
  z extent first reaches 25, switch once to G-G §XII's simple-cap values:
  `rho=0.1`, `phi=0`, all `kappa=0.1`, all `mu=0.001`,
  `ggThreshBeta(0,1)=5`, `ggThreshBeta(1,0)=ggThreshBeta(2,0)=ggThreshBeta(1,1)=2.4`, and
  `ggThreshBeta(2,1)=ggThreshBeta(3,0)=ggThreshBeta(3,1)=1`.
- G-G timeline semantics: the parameter vectors jump; `a`, `b`, and `d` are untouched, `rho`
  and `phi` are unchanged, so `Sigma(b+d)` is continuous at the event and remains conserved.
  Ramps and state reconstruction are unsupported.
- Continue to the ordinary far-field stop, with a 10,000-tick cap.
- `A-TIMELINE-STAGE1`: at the event z extent is `>= 25` and AR `>= 2`.
- `A-TIMELINE-STATE`: exactly one event fires, the before/after field hashes are identical,
  and mass is continuous to bit identity at the event.
- `A-TIMELINE-CAPS`: final `capScore >= 1.2`, both cap radii are at least `trunk + 2`, their
  radii differ by at most 1, and occupied z extent is `>= 24`.
- `A-TIMELINE-VALID`: far-field termination, exact D6h, no contact, and mass drift `< 1e-10`.

Calibration only: the inherited solver switched at tick 845 with z extent 25 and AR 2.778,
then stopped at tick 3,741 with trunk radius 10, cap radii 13/13, and capScore 1.3.

#### A-BRANCH — high-vapor dendritic result

- Published `dendrite` parameter vectors with `rho=0.105` (the paper's fern endpoint), dims
  `160,160,48`, seed 1, noise 0, at most 12,000 ticks, ordinary far-field stop.
- `A-BRANCH`: final `branchCount >= 6` and AR `< 0.3`. Let its final integer `tExtent` be `L`.
  The live compact comparator uses the exact published `plate` preset, the same dims/domain/
  seed/noise/far field, and stops on the first tick with `tExtent >= L` (12,000-tick cap;
  reaching the ordinary far-field stop first is invalid). Its branchCount must be 0. This
  first-crossing rule is the complete meaning of “same-size”; all shared validity criteria
  apply to both runs.
- The top-view capture must visibly show six separated primary arms; sidebranch density is a
  visual diagnostic, not smuggled into `branchCount`.

The inherited Phase 2 record measured branchCount 6 at `rho=0.1`; the `0.105` gate endpoint is
chosen from G-G §VIII before the Phase 4 run and is not tuned after seeing its output.

### Pass B — diagnostic `LibbrechtKinetics` protocol

Pass B uses the accepted forward policy `aggregate-hv-g1h1-v4`; `legacy-v3` may only reproduce
the immutable v3 failure and cannot satisfy Phase 4 execution provenance. Its common dev-scale
protocol is fixed before any Phase 4 v4 morphology probe:

- Dims `48,48,48`, hexPrism, fixed-supersaturation Dirichlet, target largest extent 24, surface
  step cap 50,000; canonical seed; `surfacePolicy=aggregate-hv-g1h1-v4`.
- `CAK_A1`, `sigmaInfinity=0.002`, `dx=0.35 um`, pressure 101,325 Pa, fill-CFL 0.1,
  `relaxTol=1e-9`, `divTol=1e-7`, `relaxMaxSweeps=200000`, noise 0 unless stated, seed 1.
- Every run must pass every stable criterion below. These are **blocking execution criteria**,
  even when the morphology verdict is diagnostic:

  - `B-EXEC-PROVENANCE`: Node `v24.13.1`, V8 `13.6.233.17-node.40`, float64 CPU oracle,
    tracked-clean 40-hex execution commit, and final criteria-freeze commit `e567767` is its
    ancestor.
  - `B-EXEC-CONFIG`: canonical 19-site seed; exact common constants above; Dirichlet far field;
    exact `aggregate-hv-g1h1-v4`; only the scenario's registered temperature, seed, noise, or
    `sigmaInfinity` override differs. A byte-level canonical manifest comparison enforces this.
  - `B-EXEC-TERMINATION`: every run reaches its registered size target before 50,000 surface
    steps, with no domain contact, stall, skipped advance, unconverged relaxation, or alternate
    stop. The actual first-crossing extent and step are recorded.
  - `B-EXEC-SYMMETRY`: on noise-off runs, every nonempty per-step attachment delta is exactly
    D6h invariant and final `symmetryError = 0`. It does not apply to registered noise-on runs.
  - `B-EXEC-NOISE`: on a registered noise-on run, the exact epsilon, seed, and counter-PRNG
    stream are pinned by the manifest and execution code; epsilon and seed, but not the fixed
    stream ID, round-trip through the frozen LK v2 checkpoint. At the first accepted relaxation
    with both PRNG outcomes on positive-demand boundary cells, the runner independently computes
    the unperturbed coefficient and expected applied value
    `alphaHKBase*(1-noiseEpsilon*randomBit)`. Each cached boundary coefficient must agree within
    `8*Number.EPSILON*max(1,abs(expected))`, and `sigmaBoundary` must close the aggregate Robin
    equation with that expected coefficient within `1e-12*max(1,abs(sigmaOpp))`. Both outcomes
    must occur. `B-EXEC-LEDGER` then independently proves the same applied coefficients drive
    fill. Same-seed replay is bit-identical across `a`, `f`, and `sigma`. Symmetry is reported
    without a threshold. Cross-seed morphology differences remain a diagnostic `B-HOLLOW`
    verdict rather than execution validity.
  - `B-EXEC-CONVERGENCE`: every report has `converged=true`, integer sweeps in `[1,200000]`,
    finite residual in `[0,1e-9)`, finite positive shell injection and signed net surface
    exchange, and finite reported divergence. The runner independently recomputes
    `abs(shell-exchange)/max(abs(exchange),1e-300)`, agrees with the report within
    `8*Number.EPSILON*max(1,reported,recomputed)`, and requires the recomputed value `< 1e-7`.
  - `B-EXEC-SURFACE`: every interface step has finite positive `deltaTimeSeconds`, no stall or
    skip, and finite positive `maxKineticFillIncrement <= 0.1 + 1e-12`; hole-fill events remain
    separately counted and deficit-ledgered.
  - `B-EXEC-LEDGER`: before attachment application the runner independently sums the cached
    per-boundary-pixel demand using the raw field, counts, `alphaHK`, `vKin`, geometry, and that
    step's `deltaTimeSeconds`. Per step, let `ledgerError` be the absolute difference between
    `deltaPlacedFill + deltaSaturationClippedFill` and `independentDemand`; require
    `ledgerError <= 1e-12*max(1,abs(independentDemand))`. Over a run the independently
    accumulated total must close within `1e-10*max(1,abs(totalDemand))`. Hole-fill deficit is
    excluded from both sides.
  - `B-EXEC-PECLET`: the registered conservative Péclet bound is finite and `< 1e-2`.
  - `B-EXEC-CHECKPOINT`: final checkpoint metadata exactly matches the run and policy; strict
    decode/solver reconstruction succeeds; `a`, `f`, and `sigma` compare bit-for-bit and array
    lengths match; bytes and SHA-256 are recorded without rewriting the source artifact.
  - `B-EXEC-NUMERIC`: every required metric, report field, event value, derived constant, and
    ledger value is present and finite. Negative LK supersaturation is permitted; NaN/infinity
    and silently coerced missing values are not.
  - `B-EXEC-COMPLETE`: every registered sweep point, seed, replay, sample extent, comparator,
    and timeline event appears exactly once in the aggregate report. Missing and duplicate
    records fail by name.

The already-running, separately pre-registered 96-cubed Phase 2b v4 pair is never killed or
duplicated. If it finishes execution-validly, its honestly recorded result is linked as the
higher-resolution endpoint reference; Phase 4 still runs its own registered dev-scale sweep.

#### B-HABIT / B-SWEEP

- Temperatures `[-5, -7.5, -10, -12.5, -15] °C`; temperature is the only run-to-run change.
- `B-HABIT-ENDPOINTS` diagnostic success: AR at −5 °C is `<= 1/1.5` and AR at −15 °C is
  `>= 1.5`.
- `B-HABIT-SOLID` diagnostic success: the noise-off −15 °C endpoint has
  `crossSectionHollowness = 0` and `sealedVoidFraction = 0`.
- `B-HABIT-MONOTONE` diagnostic success: the five AR values are non-decreasing as temperature
  falls, and the categorical sequence crosses from plate to column at most once (neutral values
  may lie between). Every value and failure is reported.

#### B-DEPLETION / B-HOLLOW

- Use the registered −15 °C endpoint, regardless of its observed habit.
- Depletion samples at first crossing of extents `[10,12,14,16,18,20,22,24]`.
  `B-DEPLETION` diagnostic success: endpoint AR `>= 1.5`, all ratios finite, median `<= 0.9`,
  and at least 80% are `< 1`. `B-DEPLETION-WIDENING` additionally requires transverse extent
  to be non-decreasing and the last sample to be at least the first plus 2 lattice units.
- Hollow ensemble: same conditions with seeds `[1,2,3]` and `noiseEpsilon=0.001`, target 24.
  Diagnostic success: every run has AR `>= 1.5`, hollowness rise `>= 0.03`, final hollowness
  `>= 0.03`, sealed void 0, at least two occupancy hashes differ, and seed 1 replays bitwise.
  `B-EXEC-NOISE` replaces exact symmetry for these runs. The threshold is a pre-registered
  early-warning scale, not a natural-data claim.

#### B-TIMELINE

- Abrupt column-candidate→plate-candidate history: start at −15 °C / 0.002; immediately before
  the next interface step after the z extent first reaches 16, jump to −5 °C / 0.002; stop at
  largest extent 24 or the first blocking invalid condition.
- The timeline ADR defines absolute vapor number density as the conserved interior quantity.
  On a temperature jump each active, unattached interior cell transforms by
  `sigmaNew = (1 + sigmaOld) * cSat(oldT) / cSat(newT) - 1`; attached and wall cells remain
  excluded. The far-field shell is transformed with the interior, then the next elliptic solve
  clamps it to the new explicit `sigmaInfinity`, with that reservoir exchange reported only as
  a numerical boundary diagnostic. Growth is clamped at zero for negative local values, as in
  the existing solver. Ramps are unsupported in v1.
- The implementation must update `vKin`, `X0`, `M_ice`, boundary kinetics, and the checkpoint /
  report environment metadata atomically. Cross-temperature vapor-unit ledgers accumulate each
  step at that step's temperature; multiplying the whole history by the final `M_ice` is a named
  failure.
- Diagnostic success: the pre-event state is column-like (AR `>= 1.5`), final capScore `>= 1.15`,
  both caps exceed the trunk by at least 1, and top/bottom cap radii differ by at most 1.

#### B-BRANCH

- −5 °C, with only `sigmaInfinity` changed to `0.01` (below the source's 0.05 water-saturation
  anchor at −5 °C), target extent 24.
- Diagnostic success: branchCount `>= 6` and AR `< 0.3`. Execution criteria remain blocking.

### Timeline API and replay integrity

The implementation uses a pure, operator-tagged schedule module in `core/` plus narrow mutable
environment methods on the CPU solvers; it does not hide a schedule in runner conditionals.
Every event has an exact trigger (`tick`, `largestExtent`, `zExtent`, or `tExtent`), a
before/after environment, and a deterministic event index. The app worker and runner consume
the same schedule evaluator.

The schedule's counter is completed solver cycles. A `tick=N` event fires at the cycle boundary
where exactly N cycles have completed, before the **next** cycle's relaxation; therefore tick 0
fires before the first solver step. Extent triggers are observed only after a complete interface
step and fire before the next relaxation. If more than one unfired event becomes eligible at the same
cycle boundary—including different extent thresholds crossed by one simultaneous attachment
batch, or a tick event coinciding with a queued extent event—the schedule fails as ambiguous
before applying any event. Duplicate trigger declarations are rejected at validation. Phase 4
does not silently choose an event order.

The Phase 4 report records the full schedule and event log. Existing checkpoint wire contracts
are not silently widened: GG v1 stays frozen, LK v1/v2 retain their meanings. If resumable
timeline checkpoints are implemented, they require explicitly versioned new headers and
mutation tests; otherwise Phase 4 checkpoints are final-state artifacts accompanied by the
required schedule manifest and are not advertised as resumable mid-history.

### App and visual passing criteria

- **V4-1** The app remains worker-only for live solver stepping and keeps Phase 3 stop-rule
  parity. An operator-neutral display snapshot identifies `GGThreshold` or
  `LibbrechtKinetics`, its field semantics (`d` model units vs dimensionless supersaturation),
  and boundary state (`b` vs `f`) without relabeling one as the other.
- **V4-2** The developer controls can select Phase 4 scenarios and inspect actual gate
  checkpoints/snapshots. A loaded artifact displays its policy, temperature or G-G control,
  seed, tick/physical time where applicable, evidence status, and recorded backend. Loading is
  view-only and cannot mutate evidence bytes.
- **V4-3** The existing overlays stay honest per operator. Any G-G threshold-progress overlay
  is disabled or replaced by a correctly defined LK boundary-growth propensity; no LK view
  displays G-G boundary mass. Picking reads the actual field and surface state.
- **V4-4** The vertical slice and depletion HUD use the shared core metric. Column captures show
  a visibly darker/lower-value band above the basal center than the rim whenever the metric
  says ratio `< 1`; a mismatched picture and number is a blocker.
- **V4-5** `node app/scripts/visual.mjs --phase4` writes a manifest and full-resolution PNGs for:
  Pass A plate endpoint, column endpoint, hollow-column slice, capped-column side profile,
  dendrite top view; and each available Pass B counterpart. Every capture names the source
  checkpoint hash, operator/policy, controls, seed, size, metric values, and actual backend.
- **V4-6** The harness exercises WebGPU when available and the forced WebGL2 fallback, reports
  what actually ran, and has zero console, page, or in-app errors. The coordinator and an
  independent reviewer inspect every capture at original resolution; composition, clipping,
  illegible slice ranges, misleading labels, or a visually absent claimed morphology fail.
- **V4-7** Root `npm test`, app build, Rule 7 scan, and the Phase 3 screenshot harness remain
  green. No app import reaches into runner or package internals.

### Adversarial tests required before evidence

- Every stable `A-EXEC-*`, morphology `A-*`, `B-EXEC-*`, and visual validity criterion is
  tripped alone by a unit fixture; criterion code that only agrees with its own report is
  rejected.
- Symmetry controls: a noise-off asymmetric delta fails `*-EXEC-SYMMETRY`; a correctly replayed
  noisy asymmetric fixture passes the symmetry exemption. Wrong PRNG provenance, a single-
  outcome positive-input fixture, a solver output matching the zero-noise G-G counterfactual,
  an LK boundary coefficient/Robin value that ignores the multiplier, or a divergent same-seed
  replay fails `*-EXEC-NOISE`.
- Aspect sweep: shuffled, equal-adjacent, inverted-endpoint, hollow-column endpoint, incomplete,
  and different-common-parameter controls fail by name.
- Hollowing: solid column, sealed shell, pre-hollowed seed, identical seed-stream fixture, and
  domain-contact controls fail the appropriate claim. The test independently hashes occupancy.
- Capped profile: uniform shaft, one cap, off-center/asymmetric caps, fewer than five layers,
  and a correct two-cap fixture.
- Timeline: tick 0 and a later tick fire at the defined cycle boundary; an extent event fires
  exactly once after the first crossing; a batch cannot skip it; coincident newly eligible
  events reject before mutation; G-G field bytes and mass are unchanged at the event; LK density
  transform is independently recomputed, including a negative-supersaturation case; unsupported
  ramps and duplicate/ambiguous triggers reject; cross-temperature vapor ledger catches final-
  temperature multiplication.
- LK: wrong/missing `surfacePolicy`, legacy-v3 artifact, reflecting far field, residual-only
  convergence, divergence failure, clipped-demand omission, checkpoint-policy shift, and
  incomplete temperature sweep all fail execution validity.
- Visual: artifact metadata/array-length/hash mismatch, operator/field label mismatch, and
  screenshot manifest missing a required view fail before capture acceptance.

## Steps

- [x] Read PROGRESS, the active Phase 3 and Phase 2 plans, charter, decisions 0003/0005/0006/
      0007/0008, both solver specs, parameter table, current metrics/runner/app, and the source's
      hollow-column and environment-change sections.
- [x] Create isolated worktree `/Users/clipper/github/snowflake-phase4` on branch
      `codex/phase4-morphology-gauntlet`; verify the inherited baseline with `npm test`
      (258/258).
- [x] Run coordinator-only pre-registration probes for the Pass A thresholds above. These are
      explicitly calibration, not gate evidence.
- [x] Commit this criteria-first plan before any development agent is created (`23b5d6c`).
- [x] WP0: integrate accepted Phase 2b v4 history with current Phase 3; resolve authority and
      app conflicts; full baseline verification. Integration landed at merge `b080654` with
      276/276 tests and the Phase 3 app unchanged. Review round 1 found three blockers and four
      should-fixes: negative LK supersaturation was clamped, the nominal solid-column criterion
      accepted a hollow endpoint, Pass B execution checks were unnamed, capped-profile/trigger/
      widening semantics were incomplete, and handoff text was stale. The solver fix landed at
      `cc63a87` with 278/278 tests; this criteria/handoff amendment addresses the remaining
      findings. Round 1 also independently passed the app build, proved Phase 3 trees object-
      identical to `23b5d6c`, and ran the isolated Phase 2a control to exit 0 with canonical
      SHA-256 `f1796b501564937874065d411455a02a7c8dfb673710df01f799500df0d3a389` at
      `out/phase4/controls/wp0-phase2a-plate.ckpt`. Re-review round 2 verified all round-1 fixes,
      then found one blocker (exact symmetry contradicted the noisy ensembles) and one should-
      fix (tick-N wording referred to an already-completed cycle). This amendment makes noise
      validity replay/PRNG-based, retains exact symmetry for noise-off runs, and says “next
      cycle” explicitly. Re-review round 3 found that PRNG samples plus replay still allowed a
      solver to ignore the noise; the applied-noise reference/Robin witnesses above close that
      vacuity without turning B morphology into execution validity. It also clarified that the
      fixed LK noise stream stays in manifest/code provenance rather than widening v2
      checkpoints. Re-review round 4 reported **CLEAN — zero blockers and zero should-fixes**;
      278/278 tests and the app production build passed, Phase 3 remained unchanged, and the
      tracked worktree was clean.
- [x] Freeze the review-strengthened criteria before feature implementation (round-1 freeze
      `98e510d`, noise-scope freeze `7e2d08f`, final applied-noise-witness freeze `e567767`);
      both gate provenance checks require the final commit as an ancestor.
- [x] Write/accept overlap ADR 0010 and timeline-semantics ADR 0011; update charter to v1.9 and
      PROGRESS before Phase 4 feature implementation.
- [ ] WP1: pure metrics, schedule evaluator, gate verdict/report types, and adversarial fixtures.
      Implementation and coordinator audit were green at 364/364 tests plus the app build.
      Independent review round 1 then found three blockers: forged/late timeline histories,
      assertion-only habit/depletion crossings, and self-reported hollowing with an aliased
      replay. Four should-fixes cover finite B depletion, negative-zero schedule identity,
      returned snapshot aliasing, and missing raw morphology false paths. All are repaired with
      raw-boundary/full-state negative controls; coordinator follow-up also pins non-shrinking
      retained histories, finite endpoints, and legitimate shared-boundary depletion samples.
      Root tests are 372/372 and the app build is green; same-reviewer re-review is next. WP2
      remains blocked.
- [ ] WP2: solver environment transitions, runner `gate4a`/`gate4b`/`gate4`, artifacts, and
      checkpoint/provenance validation. Separate review → fix loop.
- [ ] WP3: operator-honest app snapshots, scenario/artifact inspection, Phase 4 visual harness.
      Separate code + visual review → fix loop.
- [ ] Run the complete regression suite, Phase 2a byte control, gate3 regression, app build, and
      both screenshot backends; loop every failure.
- [ ] Run flagless Pass A and record the blocking result with hashes and exact metrics.
- [ ] Run flagless Pass B and record both execution validity and every positive/negative
      diagnostic morphology finding without tuning.
- [ ] Inspect all Phase 4 captures at full resolution; independent reviewer does the same;
      regenerate after any finding.
- [ ] Final adversarial whole-phase review; zero blockers and zero unaddressed should-fixes.
- [ ] Update PROGRESS and this plan with exact evidence and a cold-start next step; commit a
      tracked-clean deliverable branch.

## Out of scope

- GPU/WGSL work, GPU-sized sweeps, Metal/D3D12 comparison, or Phase 5 packages.
- SDAK, nonlocal signed-terrace classification, Gibbs–Thomson changes, event-limited LK
  stepping, parameter retuning, or alternate surface policies. None may rescue Pass B.
- Phase 6 validation claims, Nakaya-diagram sweeps, domain/grid/timestep convergence, or an
  Evidence upgrade beyond unvalidated/diagnostic.
- A polished product timeline editor, interpolation curves, gallery/export, smooth ice
  surfaces, or post-processing. Phase 4 builds deterministic schedule plumbing and developer
  inspection; Phase 7 owns product design.
- Rewriting the frozen GG v1 checkpoint header or mutating prior gate artifacts.
- Treating screenshots as gate evidence. They are required visual QA and explanatory
  diagnostics; automated metrics and exit semantics carry the scientific claims.

## Tried and rejected

- **Starting agents before criteria.** Rejected by maker direction. All development and review
  delegation waits for the commit containing this plan.
- **Aspect ratio alone as “solid column,” and the original size-36 habit sweep.** Rejected by
  WP0 review before feature implementation. The registered `u=1` endpoint had AR 2.1765 but
  `crossSectionHollowness = 0.1260`, so it was an open tube. The corrected target is 14 (actual
  first crossing 15 in calibration), with an exact zero-hollowness endpoint criterion and a
  hollow-column negative control. The original size-36 numbers are killed calibration, not
  evidence.
- **Unnamed bundles of execution validity.** Rejected by WP0 review. Pass A now has stable
  `A-EXEC-*` criteria and Pass B has individually trippable `B-EXEC-*` criteria, including a
  numeric independent-demand ledger tolerance; implementation cannot invent those semantics.
- **Exact D6h as a shared validity rule for noise-on ensembles.** Rejected by WP0 re-review.
  Per-cell noise breaks D6h by design; the registered A-HOLLOW probe first broke a delta at tick
  151 and ended with symmetry error 0.1334. Noise-off runs retain exact symmetry. Noise-on runs
  instead require exact PRNG provenance and bit-identical same-seed replay, while mass/domain/
  convergence/ledger checks remain in force and symmetry is reported without a threshold.
- **PRNG samples plus replay as sufficient proof that noise was applied.** Rejected by WP0
  re-review: an implementation could ignore the multiplier, print independently correct random
  bits, and replay the wrong result exactly. G-G now needs a raw-state independent diffusion
  witness that differs from the zero-noise counterfactual; LK needs independently recomputed
  applied coefficients closing both the Robin equation and fill ledger. Cross-seed B morphology
  remains diagnostic.
- **Running Phase 4 in the Phase 3 worktree.** Rejected: Phase 3 external testing and artifacts
  remain independently inspectable. This branch has its own worktree and output tree.
- **Silently starting Phase 4 under charter v1.6's sequential rule.** Rejected: the maker asked
  for overlap. A narrow ADR and same-session charter edit are required after the accepted v4
  authority chain is integrated.
- **Using the old per-contact LK implementation.** Rejected: the concurrent accepted Phase 2b
  branch proved v3 routed the source's broad prism configuration through a temperature-
  independent rough path. Pass B uses the policy-versioned v4 aggregate boundary condition;
  v3 remains immutable negative history only.
- **Treating a Pass B morphology miss as a bug to tune away.** Rejected by charter and ADR 0005.
  Only execution-integrity failures loop to code. A valid negative is the deliverable.
- **Noise-off “multiple seeds.”** Rejected as vacuous because the seed is unused. Pass A's
  hollow ensemble registers a labeled stress noise that measurably changes trajectories, plus
  a same-seed deterministic replay.
- **Needle as a non-hollow control.** Rejected by measured and source evidence: the published
  needle preset grows a slender hollow tube (recorded hollowness 0.074). Solid synthetic fixtures
  provide the negative control instead.
- **A final-sample-only depletion claim.** Rejected after Phase 3 measured layer-nucleation
  sawteeth. Phase 4 uses a registered extent window and robust statistics.
- **A 3D sealed-void metric as “hollow column.”** Rejected: real and modeled hollow columns are
  open tubes; `crossSectionHollowness` is the gate and `sealedVoidFraction` is a separate check.
- **The charter's plate→column wording for capped columns.** Rejected as source- and geometry-
  inconsistent. G-G §XII grows a shaft under column conditions and then switches to plate
  conditions to grow caps. The timeline ADR corrects the direction explicitly.
- **Holding stored LK supersaturation fixed through a temperature jump.** Rejected: that silently
  creates/removes absolute vapor throughout the interior. Interior absolute number density is
  conserved by the registered affine transform; the explicit far-field reservoir change is
  handled by the following Dirichlet solve.
- **Multiplying an all-temperature LK fill ledger by the final temperature's ice/vapor scale.**
  Rejected: the conversion is temperature-dependent. Vapor-unit ledger increments accumulate at
  the temperature of each interface step.
- **Ramps in the first real timeline.** Deferred, not approximated. An abrupt source-cited event
  gives exact replay semantics and isolates the conserved-field decision; ramps require a time
  interpolation contract and belong in a later ADR.
- **Trusting derived first-crossing booleans or leaving no-event timeline boundaries stateless.**
  Rejected during the WP1 coordinator audit. The branch comparator now carries the raw target,
  previous/crossing extents, stop reason, and matching common-configuration fingerprints. The
  timeline cursor advances at tick 0 and every completed cycle, so skipped, reversed, shrinking,
  or late-observed boundaries fail instead of masquerading as the first crossing.
- **Treating a validated cursor or target label as proof of prior history.** Rejected by WP1
  review round 1. A caller could forge a cursor already past an unfired extent trigger, or label
  arbitrarily late depletion rows with the registered targets. Event logs and morphology samples
  must carry independently checkable preceding/crossing boundaries; habit growth needs the same
  raw target-stop evidence.
- **Self-reported hollow metrics and a replay alias.** Rejected by WP1 review round 1. One-hot
  occupancies with fabricated aspect/hollow/void numbers passed, and the original run object
  could stand in for its replay. Hollow verdicts must recompute metrics from dimensioned raw
  initial/final occupancy, and replay evidence must be a separately identified execution with
  non-aliased buffers.
- **Launching a duplicate 96-cubed v4 pair.** Rejected: the pre-registered Phase 2b process is
  already running in another worktree. Phase 4 leaves it untouched and uses a separately
  registered 48-cubed diagnostic sweep.

## Open questions

- None that block implementation. Pass B morphology is intentionally unknown; its uncertainty is
  the experiment, not a question to answer before running it.
