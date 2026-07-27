# Plan — Phase 6: Validation against the Nakaya diagram

- **Phase:** Phase 6 — validation, not calibration (decision 0003)
- **Status:** registered, WP0/WP1 in progress. **No validation sweep runs until the freeze
  lands**, and the freeze now waits on convergence evidence rather than preceding it.
- **Started:** 2026-07-26
- **Last touched:** 2026-07-26 by Claude
- **Charter version at registration:** v1.16 (2026-07-24)
- **Revised 2026-07-26 on the operator's stated priority: accuracy to reality and science
  first; development and runtime speed secondary.** That priority changed five things, each
  recorded where it applies: the sweep runs on the **float64 CPU oracle** rather than the
  float32 GPU port; **domain convergence runs before the grid freeze** rather than after;
  measurement precision is spent on **temperature spacing near the boundaries** rather than on
  aspect-ratio resolution; the parameter **uncertainty is swept rather than narrated**; and the
  **1D spherical reference solver** returns to scope as the only absolute accuracy anchor.

## Goal

Produce the model's own temperature-vs-supersaturation morphology diagram and lay it beside the
published one, stating the agreements *and* the disagreements. This is a test the model is
allowed to fail, and the phase is built so that failing is reportable rather than embarrassing:
the protocol freezes before the first sweep, so no result can be reached by tuning until the
picture matches.

## Done when

Charter §3.2, Phase 6, **verbatim at plan registration** (charter v1.16, line 312):

> Done when the model's temperature-vs-supersaturation morphology diagram is compared against
> Nakaya's, with the agreements and the disagreements both stated. A negative result is a
> result: if the model does not reproduce the flip, that is a finding about the model, it is
> reported as one, and GGThreshold still ships a beautiful crystal (Phase 2a). What is not
> permitted is quietly tuning until the diagram matches and calling it validation — the
> protocol freeze (item 1) makes that structurally impossible rather than merely forbidden.

The falsifiable test it names (charter line 308, verbatim):

> The falsifiable test: does the model reproduce the habit reversals? Plates near −2 °C, columns
> near −5 °C, plates again near −15 °C, columns below −30 °C. Scoped honestly (v1.3, decision
> 0005): no-SDAK and SDAK runs are reported separately; with Nakaya-informed (P3) SDAK inputs
> active, matching the diagram is in-sample reproduction — the no-SDAK probe (does the measured
> large-facet crossing alone produce any reversal?) is a first-class result in its own right,
> and independent validation runs against held-out observables (growth rates, size-dependent
> habit, pressure dependence, histories; §2.7).

Exit 0 of the registered flagless gate command is the phase claim. A *morphology miss is not a
gate failure*: the gate fails on invalid numerics, provenance, artifacts, incomplete runs, or a
protocol violation — never on the model disagreeing with the diagram. That separation is what
makes "a negative result is a result" executable rather than aspirational.

## Authority and starting state

Governing sources, in authority order:

- **Charter** §1.5 (Evidence labels — only Phase 6 can grant "quantitatively validated over a
  named domain", and only where the comparison holds), §2.3 (the Nakaya diagram; "this diagram
  is v1's report card: the model does not need to reproduce it quantitatively, but it must be
  able to move across it qualitatively"), §2.4 (fixed-σ Dirichlet far field **required for every
  Phase 6 validation run**), §2.5 and §2.7 (provenance classes P1–P4; the in-sample/held-out
  split), §3.1 (host; the 65% domain-contact guard is a collision heuristic, and flagged runs
  never enter validation results), §3.2 Phase 6 (items 1–7), §3.3 (standing guardrails).
- **Decisions.** 0003 (Libbrecht kinetics make temperature a physical input, so Phase 6 is
  falsifiable), **0005** (the phase's constitution: D1 provenance classes and split reporting;
  D4 the expanded freeze list and the convergence studies), 0006 (dual convergence; `divTol` and
  `relaxMaxSweeps` join the freeze list), 0009 (the coupled `surfacePolicy`
  `aggregate-hv-g1h1-v4` joins the freeze list), 0004 (research media is not versioned — what
  Phase 6 needs from it must be a derived, citable measurement in a tracked file), 0011
  (timeline semantics for any history run), 0016/0018 (the sweep host; Windows/D3D12 scope).
- **Solver truth.** `docs/attachment-kinetics.md`, `docs/gg-machinery.md`,
  `docs/libbrecht-parameters.md`, `docs/monograph-review.md`.

**Permanent controls.** `GGSolver`, `LKSolver`, `GGThreshold`, `LibbrechtKinetics`, the strict
CPU checkpoints, and all accepted Phase 2–5 evidence stay as they are. None may be deleted,
weakened, or reinterpreted to make a comparison come out better. The float64 CPU solvers remain
the oracle; Phase 5's float32 GPU port is a speed instrument whose only established claim is
conformance to that oracle on observed Windows/Chromium/D3D12.

**Starting state.** Phases 2a, 2b, 3, 4 and 5 are complete with zero-finding review. Phase 5's
canonical evidence is the `c436df5` bundle at `out/phase5/` (`gate5` 16/16). Phase 4 Pass B
already records five honest morphology misses out of eight diagnostics; per charter line 278 a
failed Pass B does not block Phase 6 — reporting that failure properly is precisely this phase's
job. `ADR 0010`'s phase-overlap exception ended with Phase 4, so Phase 6 runs under the ordinary
sequential rule.

**Host.** The registered sweep host is the Ryzen 7 5700G / 64 GB / RTX 3080 10 GB Windows
machine (ADR 0016). One process per physical adapter unless a registered protocol proves a
different arrangement.

## What Phase 6 compares against

The project owns two reference sources, and they answer different questions. Conflating them is
the single largest scientific risk in this phase, because their boundaries genuinely sit at
different `(T, σ)`.

| Source | What it is | Role here | Strongest permitted claim |
|---|---|---|---|
| **The Nakaya diagram** — Libbrecht 1211.5555v1 Figure 1 (printed p. 2), digitized in [`research/nakaya-morphology-diagram.md`](../../research/nakaya-morphology-diagram.md) | The classical morphology diagram, redrawn. Measured boundaries **−3.3, −9.9, −21.5 °C (±0.5)** bounding plates → columns → plates → columns-and-plates | **The report card.** Does the model cross plate → column → plate → column at roughly the right temperatures? | Qualitative / ordinal. Never percent-level onset claims: it is a schematic composite of natural free-falling crystals, and its σ axis is measurably off (below) |
| **Libbrecht Figure 8.16** — the e-needle grid indexed in `research/lab-validation-dataset.md` (109 morphology tiles, T −0.5 to −21 °C, σ 8–128% rel. ice) | Controlled measurements of isolated single crystals on e-needle tips at fixed `(T, σ)` per tile | **Quantitative onset boundaries**, measured in the same geometry class our runs use | Quantitative onset/trend comparison — but only after the column-seed ADR and per-entry PDF re-verification |

Two consequences the plan is built around:

1. **The charter's wording is satisfied literally.** The gate says "compared against Nakaya's",
   and §2.3 says the comparison need only be qualitative. Using Figure 1 as the report card
   therefore needs no deviation ADR.
2. **Figure 8.16 costs more than it looks.** Its entire grid is e-needle geometry, and
   `research/lab-validation-dataset.md` rule 3 states that adding an elongated seed class is an
   **ADR-level change for evidence use** (the canonical 19-site seed is pinned). That ADR is
   deferred until the quantitative work package, not taken on now.

`research/lab-validation-dataset.md` rule 1 governs both: association is not human-certified,
and **every entry must be re-verified against the canonical PDF before any accepted
comparison**. Rule 2 governs σ semantics — `sigma_surf` (kinetics-only), `sigma_infinity`
(transport included), and relative-to-ice values that legitimately exceed water saturation are
never mixed.

### Digitizing Figure 1 into citable reference data

Under ADR 0004 the page renders are not versioned and cannot be evidence as they stand; there is
no tracked index for 1211.5555 at all. WP1 therefore produces one, and it is a derived
measurement with a stated uncertainty, not a screenshot:

- **Read** the three habit-boundary temperatures and the regime sequence, with an explicit read
  uncertainty (the boundaries are dashed lines on a schematic; the honest figure is ±1–2 °C).
- **Convert** the y-axis: the figure's supersaturation is absolute excess vapour density in
  g/m³, while the solver's σ is a fraction relative to ice. `σ = Δρ / ρ_sat,ice(T)`, with
  `ρ_sat,ice` from `cSat()` in `core/src/libbrecht.ts`. This is arithmetic, not a fit.
- **Cross-check the reading against the source's own ink.** The water-saturation curve drawn on
  the figure is a known physical function of temperature, and `sigmaWater()` already computes
  it. Digitizing that curve and comparing it against our computed values verifies the axis
  reading and the conversion; a disagreement means our transcription is wrong, and catching it
  here is what stops a digitization error from being reported later as a disagreement about the
  model. **The cross-check runs before any boundary is registered, and its residual is
  recorded.**

## Approach

### One registered protocol per sweep, never merged

Phase 6 does not run as a single monolithic freeze. It runs as a sequence of **registered
protocols**, each frozen before its own sweep, each pinned by hash the way
`PHASE4_CRITERIA_FREEZE`, `GATE2B_PREREGISTRATION` and `PHASE5_PROTOCOL_SHA256` are, and each
reported separately. Charter item 1 binds every one of them: any post-freeze edit needs a logged
ADR and **invalidates that protocol's prior sweep results — the sweep re-runs in full**.

The first protocol is the no-SDAK reversal probe. Later protocols (SDAK-active reproduction,
quantitative onset comparison against Fig 8.16, held-out observables) are registered when their
work packages open. Splitting this way does not weaken pre-registration — each sweep is still
fully frozen before it runs — and it avoids freezing a grid for work whose requirements are not
yet known, which would guarantee an ADR-and-re-sweep cycle later.

### Reporting rules that hold for every protocol

- **No-SDAK and SDAK results are never merged in a report** (charter §3.3; ADR 0005 D1).
- Wherever P3 inputs are active, the comparison is labelled **in-sample reproduction**, never
  independent validation.
- Results are never compared across far-field boundary conditions silently. Every Phase 6
  validation run uses **fixed-σ Dirichlet** (charter §2.4).
- Any run that trips the 65% domain-contact guard is invalid for validation and is excluded by
  name, not silently dropped.
- Evidence labels move to "quantitatively validated over a named domain" only where a
  comparison actually supports it, and only for the named domain.
- Exploratory comparisons say that they are exploratory.

### Numerical verification (charter item 2), and why it now runs first

Grid-, timestep- and domain-convergence studies at representative sweep points. The 65%
domain-contact guard is a collision heuristic and **is not** a proof that the far boundary is
irrelevant; only a domain-convergence study is.

**These run before the grid freeze, not after it.** Calibration measured a crystal at 28³ and
extent 17 coming out as a *needle* (aspect ratio 3.4, on both engines) at the same temperature
and far field where Phase 2b at 96³ and extent 61 produced a *plate* (0.119). A small domain is
therefore not a coarse version of the right answer — it is a different regime, with the
Dirichlet shell close enough to keep feeding the crystal. Freezing a grid before that is
characterised would produce confidently wrong physics at every point, and by charter rule the
correction would cost a full re-sweep.

**The 1D spherical reference solver is in scope** (reversing this plan's first draft). Convergence
studies establish only that the solver agrees *with itself* under refinement. The 1D spherical
`LibbrechtKinetics` reference proposed in `docs/monograph-review.md` is the project's only
**absolute** accuracy anchor — the one control that can say the numbers are right rather than
merely self-consistent. Under the operator's accuracy-first priority that is worth its cost.

**Cross-platform reproducibility is a registered control.** IEEE 754 makes `+ − × ÷ √`
correctly rounded everywhere, but `Math.exp`, `Math.log` and `Math.pow` are not specified to be,
and this solver depends on them throughout (`pSatIce`, the attachment coefficients, `v_kin`).
Results may therefore differ in the last ULP across engine versions or CPU architectures. Phase
2b already pinned its exact Node/V8 build and declined any cross-engine bitwise claim. Phase 6
goes one step further and *tests* it: the same registered fixture runs on a second machine
(Apple M-series, arm64) and the habit classification is compared. **If a classification changes,
that conclusion was resting on a last-ULP coin toss and the finding is reported as fragile.** If
no second machine is available the claim is scoped to the registered host and says so.

## Pre-registration contents (WP0)

The freeze list is charter line 303 plus its amendments. WP0 is complete when every row below
has a registered value in a tracked protocol module, `docs/libbrecht-parameters.md` is frozen,
and the freeze commit is an ancestor of every execution commit that follows.

| Group | Frozen items |
|---|---|
| Comparison design | The T/σ grid; the crystal size at which habit is measured (habit is size-dependent, so a stated maximum dimension is what keeps comparisons apples-to-apples); metric thresholds; the uncertainty-reporting scheme |
| Physics inputs | `docs/libbrecht-parameters.md` in full; pressure; the parameter interpolation scheme (an open P4 choice today — see Open questions); noise amplitude; physical seed size |
| Boundary and domain | Fixed-σ Dirichlet far field (charter §2.4); domain budgets; Δx |
| Surface operator | The named coupled `surfacePolicy` `aggregate-hv-g1h1-v4` (ADR 0009) |
| Numerics | Fill-CFL bound; diffusion residual tolerance **and its norm**; the divergence-identity tolerance `divTol`; the relaxation-sweep cap `relaxMaxSweeps` (ADR 0006); float precision |
| Statistics | Seed-ensemble size |
| Provenance | Model/code version (commit hash); exact engine version; host and adapter identity |

**Threshold values land from calibration probes, and those probes are not evidence.** This is
the Phase 3 pattern: run coordinator-only probes, register the resulting numbers here with the
probe output named, and state the margin reasoning. A probe's printed metrics are never citable
as a gate result.

### Calibration results so far (2026-07-26, CPU, coordinator-only — not evidence)

A 3 × 3 matrix at 48³, measurement extent 16, water-relative σ fractions 0.15/0.50/0.90,
temperatures −5/−10/−15 °C. Run first under v5, then **re-run in full under v6** after WP0b
(below) found the v5 boundary operator was not D6h-equivariant. The v6 matrix is the citable
one; the v5 numbers are kept only where the two differ, because the differences are themselves
informative.

**0. The v6 re-run (2026-07-26).** Seven of nine points completed; all seven reported
`symErr = 0` **and** `deltaSymClean = true`. Six of the seven reproduce their v5 attached count
and aspect ratio exactly — the operand-order fix changes nothing at those points. The exception
is the point that opened WP0b, (−5 °C, f = 0.50), where attached moves 765 → 749 at the same
stop step, extent and `AR = 0.606`. Two points were over budget under both policies
((−10, 0.15) and (−15, 0.15)); a third, (−15, f = 0.50), completed in 289 s under v5 and
exceeded the 300 s budget under v6 — see the cost note in point 2.

**1. The habit metric does not resolve at a small measurement size — and this survives v6.**
`AR = 0.740421` came back from **four** of the seven completed v6 runs — (−5, 0.90), (−10, 0.50),
(−10, 0.90) and (−15, 0.90) — whose attached counts are 761, 929, 843 and 929. Physically
different crystals cannot share an aspect ratio to six digits: at extent 17 the integer bounding
box is quantized so coarsely that the metric is degenerate. Only the two warmest, lowest-σ points
separated at all (`0.471` and `0.606`, both plate, matching the σ₀-ordering prediction and Phase
2b's plate at −5 °C). Phase 2b measured at extent 61 and got `0.119` versus `12.2` — enormous
separation. **Consequence: the registered measurement size must be large enough for the metric to
discriminate, and that size has to be established by probe, not assumed.** A grid frozen at a
degenerate measurement size would produce a diagram of one value.

**2. CPU cost is high — but the claim that "the GPU is therefore a prerequisite" was WRONG, and
is retracted here.** At 48³/extent 17 CPU runs cost 191–298 s, and the two lowest-σ cold points
(−10 and −15 at f = 0.15) exceeded a 300 s budget without finishing — slow growth means many
steps, so the *low*-σ end is the expensive end at cold temperatures. ADR 0023's operand sort adds
about **5%** to that (measured properly: fixed step count, alternating policies back to back,
+4.8% on the minimum of three repeats), which is smaller than this machine's ~14% run-to-run
variance and is not what moved (−15, f = 0.50) past the budget — that point simply sits on the
line. Differencing the two matrices row by row suggested overheads up to +32%; that comparison is
invalid and the number to carry is ~5%. From the cost figures alone this plan
asserted the GPU was a prerequisite. **A GPU calibration probe then measured the opposite**: at
28³ to the same target the GPU took 32.9 s against the CPU oracle's ≈5 s, roughly **6× slower**,
because the CPU warm-starts and converges many steps in a single sweep while the GPU always
submits a 16-sweep segment with a full queue sync. No size was measured at which the GPU wins.
The original sentence was an extrapolation from one engine's cost with no measurement of the
other, and that is exactly the reasoning this project is supposed to refuse.

**2b. The GPU cannot run the mirrored physics at all for sustained runs.** The frozen
`divTol = 1e-7` is an *absolute* divergence-identity tolerance, and in float32 it sits below the
roundoff floor: the probe recorded refusals at 20³/24³/28³ where the relaxation residual was
**exactly 0** and both ULP distances were **0** — a bit-stationary float32 fixed point, where
more sweeps provably cannot change anything — while the divergence residual sat at 1.0–1.6e-7,
a few ULP of the ≈0.596 operand magnitude. Refusals occurred at steps 11–47 with no monotonic
pattern in domain size, which is what a roundoff floor straddling a fixed absolute threshold
looks like. Phase 5 only ever conformance-tested the GPU LK path at 24×24×18 for **four**
interface steps, so sustained GPU LK running is new ground rather than a regression.

**Consequence:** the engine choice must be re-decided on this evidence, and running the sweep on
the GPU would first require an ADR replacing the absolute `divTol` with a magnitude- and
cell-count-relative bound — the shape decision 0014 already uses for smoother drift. That is a
protocol decision, not something a probe or a work package may substitute quietly.

**3. A symmetry observation that turned out to be a solver defect — RESOLVED in WP0b.** The
(−5, f = 0.50) run reported `symErr = 0.020915` with noise off, where every other run in the
matrix reported exactly 0. It was neither a tie-break degeneracy nor a small-domain artefact:
the v4/v5 boundary operator sums the Eq. 5.35 opposing-vapor operands in lattice-gather order,
which rot60 permutes non-monotonically, so in float64 it is not D6h-equivariant from three
operands up. [ADR 0023](../decisions/0023-d6h-equivariant-opposing-vapor-mean.md) adds policy
`aggregate-hv-g1h1-v6`, which sums those operands in ascending value order. See WP0b below for
the mechanism and the evidence.

**Two things in this section are therefore superseded.** First, the sibling runs' `symErr = 0`
did **not** establish that they were symmetric — `symErr` is a snapshot at the stop instant,
and only `deltaSymClean` covers the whole run. That said, **two of them were then measured and
were clean**: re-running (−5 °C, f = 0.90) and (−10 °C, f = 0.50) under v5 with the dropped
field captured returned `deltaSymClean=true` for both. So of three v5 grid points examined one
broke and two did not — the field asymmetry is chronic (at 32³ it appears at growth step 14
while the attached set stays invariant through step 40) but reaching the attached set is
condition-dependent. Second, **every
number above was measured under v5 and has to be re-measured under v6** before it can inform a
freeze; the v6 re-run is in flight. Finding 1 (metric degeneracy at small measurement size) and
finding 2/2b (engine cost and the float32 `divTol` floor) rest on comparisons across runs that
all shared the defect, so their *direction* is expected to survive but their *values* are not
citable.

**The pre-freeze corrections are done (2026-07-26).** Four source-verified corrections landed
in `docs/libbrecht-parameters.md` while they were still free to make; after the freeze each
would have cost a full re-sweep by charter rule. SDAK-2 is recorded as an `A_prism` mechanism
restricted to small prism facets above ≈ −10 °C rather than as a missing `A` gap (§4.2); the
printed width parameterization `sigma_0 = sigma_0,∞[1 − exp(−w/w_0)]` from [2015Lib2] is
recorded (§4.3); the latent-heating parameter `chi_0(T, P)` has anchors, its first-order
`sigma_inf → sigma_inf/(1 + chi_0)` correction, and its `chi_0 ~ P⁻¹` scaling (§7); and the CAK
pressure-independence assumption is qualified with the monograph's own retraction of it. Every
quotation was verified against the page renders rather than taken from `monograph-review.md`.
Two decisions those corrections surface belong to this work package: whether latent heating
enters as a labelled correction or a stated systematic, and how `chi_0` is interpolated between
its two printed anchors.

## Gate contract

The registered flagless gate command's exit 0 is the phase claim. WP0 supplies exact criterion
names and numerical thresholds, but it may not remove a row.

| Area | Blocking claim |
|---|---|
| Pre-registration | The protocol freeze commit and the frozen parameter table are ancestors of the execution commit; the protocol hash matches; the tree is tracked-clean |
| Provenance | Host, adapter, engine, commit, protocol/parameter hashes, and the far-field condition are recorded per run and authenticate |
| Reference data | Every reference boundary used is a derived, citable measurement with stated uncertainty; the Figure 1 water-saturation cross-check is recorded with its residual |
| Execution validity | Every sweep point completed, converged under both convergence controls, and stopped for a registered reason; no run that contacted its domain enters the results |
| Numerical verification | Grid, timestep and domain convergence studies ran at the registered representative points and are reported with their deltas |
| Habit classification | Every sweep point is classified by the registered metric at the registered measurement size, including `neutral` and `invalid` outcomes |
| Diagram artifact | The model's own T-vs-σ diagram is produced from the run set, with every point traceable to its run |
| Comparison honesty | Agreements *and* disagreements are both stated; no-SDAK and SDAK results are reported separately and never merged; P3-active comparisons are labelled in-sample |
| Negative controls | Each registered control fails by name: forged provenance, a post-freeze parameter edit, a merged no-SDAK/SDAK report, a domain-contacted run entering results, a mismatched far-field condition, and a habit classification taken at the wrong measurement size |

A morphology miss does not change exit 0. Invalid numerics, provenance, artifacts, incomplete
runs, or protocol violations exit 1. Any flag exits 2.

## Steps

The order below changed on 2026-07-26: **numerical verification now precedes the grid freeze**,
because calibration showed a small domain produces a different growth regime rather than a
coarser one, and a grid frozen against that would be wrong at every point.

- [ ] **WP0a — decisions that need no probe.** **DONE** (`7382df4`, `b5a35b5`, `f9e335b`,
      `5c5537f`, `cbe0f7a`): pre-freeze source corrections to `docs/libbrecht-parameters.md`;
      the parameter interpolation scheme, with its justification corrected by measurement; the
      latent-heating treatment; the surface policy (`v5`, not ADR 0009's `v4` — caught by probe;
      superseded by `v6` in WP0b); the water-relative σ ladder from printed Table 2.1 (the
      `sigmaWater()` difference form is unusable warm); and the freeze list itself as a
      fail-closed module that refuses to
      emit a protocol manifest while any required item is pending.
- [x] **WP0b — resolve the symmetry anomaly.** **DONE 2026-07-26** — it was a solver defect, and
      it is fixed as [ADR 0023](../decisions/0023-d6h-equivariant-opposing-vapor-mean.md).

      One calibration run (−5 °C, f = 0.50, 48³) reported `symErr = 0.020915` with noise off
      where every sibling reported exactly 0. Two things came out of reproducing it.

      **The premise that it was silent was wrong.** The same run line already published
      `deltaSymClean=false`, and the heartbeat printed `deltaSym=false` from step 78. The solver
      announced the break through the incremental check built for exactly this; the WP0
      calibration harness parsed only `symErr=` and dropped it. The defect was in the solver,
      the silence was in a coordinator-only probe, and the probe now records both.

      **The cause is float64 addition order in the boundary operator.** Stage-by-stage
      instrumentation showed the in-plane smoother staying bitwise D6h-invariant — it already
      sorts its pair sums — while the first array to break is the Eq. 5.35 opposing-vapor mean.
      `opposingSigma` accumulates its operands in lattice-gather order, and rot60 permutes those
      enumeration positions by the cycle (1 3 6 2 4 5), which is not order-preserving; from
      three operands up, a cell and its image sum the same multiset in a different order, and
      float64 addition is not associative. The captured instance differs by one ulp, and
      re-summing the image's operands in the source cell's direction order reproduces the source
      value bit-for-bit. That ulp propagates through σ_b → α_HK → fill rate → accumulated fill
      until one orbit member crosses the attachment threshold a step early; the metric shows it
      only when the size target fires mid-split, which is why siblings read 0.

      **Fix**: surface policy `aggregate-hv-g1h1-v6` — v5 in every respect except that the
      opposing operands are summed in ascending value order, which makes the mean a function of
      the operand multiset alone and therefore exactly equivariant. v4 and v5 are bit-unchanged
      because Phase 4b and Phase 2b evidence was produced under them. On the configuration that
      opened WP0b, v6 gives `symErr = 0` and `deltaSymClean = true` at the same stop step (88),
      extent (17) and aspect ratio (0.605799); attached count moves 765 → 749.

      **Consequence for every calibration number so far**: they were measured under v5 and must
      be re-measured under v6 rather than carried forward. (The σ ladder is unaffected — it is
      transcribed from printed Table 2.1, not measured.) The v6 re-run of the 3 × 3 matrix is
      recorded in the calibration section above.

      **Scope note**: equivariance under v6 is structural, not statistical — smoother
      equivariant, boundary operator equivariant, clamp constant, attachment threshold
      deterministic, so invariance follows by induction from a symmetric seed and does not decay
      with run length. The longest confirmation so far is 88 growth steps at 48³. A run at the
      Phase 2b scale (96³, extent 61) belongs to WP3's convergence work, not here.

      **Not fixed**: the WGSL kernel has the same defect, in f32 where one ulp is ~1.2e-7 rather
      than ~2.2e-16. It is registered, not repaired — the GPU LK entry points already refuse any
      policy but v5, so the diagnostic lane now differs from the sweep in arithmetic width, in
      divergence tolerance, and in operand order. It can corroborate a trend and cannot be
      compared value-for-value.
- [ ] **WP0c — the remaining freeze values, after WP3.** The T/σ grid, habit measurement size,
      metric thresholds, domain budgets, Δx, pressure, seed size, noise amplitude, fill-CFL,
      residual tolerance and norm, `divTol`, `relaxMaxSweeps`, seed-ensemble size, uncertainty
      scheme, and the parameter-table freeze itself. Threshold values come from coordinator-only
      calibration probes whose printed metrics are never citable as a gate result. Two design
      rules the calibration earned: spend precision on **temperature spacing near the −3.3,
      −9.9 and −21.5 °C boundaries** rather than on aspect-ratio resolution, because the
      registered question is where the habit class changes, not the third decimal of a ratio;
      and choose the measurement size **jointly with the domain**, never independently.
- [x] **WP1 — Nakaya reference data.** **DONE 2026-07-26**:
      [`research/nakaya-morphology-diagram.md`](../../research/nakaya-morphology-diagram.md).
      Boundaries measured at **−3.3, −9.9, −21.5 °C (±0.5)**, bounding plates → columns →
      plates → columns-and-plates. Three findings changed how the figure may be used:
      (1) **its temperature axis is not uniform** — tick spacing compresses 1.77× from warm to
      cold and no linear, power or log model fits, so a single linear calibration would misplace
      every boundary by up to ~1.6 °C; calibration is piecewise between labelled ticks;
      (2) the water-saturation cross-check **passes on position and fails on scale** — the
      digitized curve peaks at −14.09 °C against our computed −14.35 °C (0.26 °C, which is what
      licenses using the boundary temperatures), but its amplitude is a flat **0.724 ± 0.030**
      of ours across −10 to −30 °C and 30–42% below Murphy-Koop, so the printed σ values are
      never used as targets; (3) incidentally, our own `pSatIce` matches Murphy-Koop within
      0.8% while our water-minus-ice excess runs 5–20% low, which touches no accepted evidence
      (`sigmaWater` is a diagnostic, not a solver input) but is recorded before any protocol
      sets a far field relative to water saturation.
- [ ] **WP3 — numerical verification. Runs BEFORE the grid freeze.** Grid, timestep and domain
      convergence studies at representative conditions, reported with deltas. The domain study
      is the only thing that speaks to far-field independence, and calibration already shows it
      is load-bearing rather than pro forma: 28³ gives a needle where 96³ gives a plate at the
      same temperature and far field. Its deliverable is the smallest domain at which the habit
      classification stops changing under refinement — which then sets WP0c's domain budgets and
      measurement size. Also includes the **cross-platform reproducibility control** (same
      fixture on arm64 and x64; a classification that differs is a fragility finding, reported
      as one).
- [ ] **WP3b — the 1D spherical reference solver.** A 1D spherical `LibbrechtKinetics`
      reference, per `docs/monograph-review.md`, giving the project its only **absolute**
      accuracy anchor. Convergence studies show self-consistency under refinement; this shows
      whether the numbers are right. Compared against the 3D solver at conditions where the
      spherical idealisation is defensible, with the idealisation's own error stated.
- [ ] **WP2 — sweep harness and diagram artifact.** A flagless registered command that runs the
      frozen (T, σ) grid on the **float64 CPU oracle**, parallel across cores (the Phase 2b v5p
      pattern: independent processes, bound and fail-closed), classifies habit at the registered
      measurement size, excludes domain-contacted runs by name, and emits the model's own
      diagram as an authenticated artifact with every point traceable to its run. Sweeps cross
      habit flips by design, so domains may not be pre-shaped to a morphology that is not yet
      known (ADR 0001 cuts both ways): use compromise near-cubic budgets or the two-pass
      probe-then-refit scheme.
- [ ] **WP4 — the no-SDAK reversal probe, swept across its own uncertainty.** Run the frozen
      grid with SDAK inactive and answer the charter's question: does the measured large-facet
      crossing alone produce any habit reversal? **The nominal parameter values are not run
      alone.** Two uncertainty axes are registered protocol rather than narrated caveats:
      (a) **both σ₀ crossing candidates** — the −6 °C raw-measurement crossing and the CAK
      curves' −9/−10 °C — which `docs/libbrecht-parameters.md` already requires before any
      conclusion "about the model"; and (b) the **±25% digitization band edges on the cold
      side**, where uncertainty-consistent draws are known to be able to reverse the basal/prism
      ordering. A conclusion that flips between draws is not a conclusion, and the sweep is what
      tells us which we have. Report the model's diagram beside Figure 1's boundaries with
      agreements and disagreements both stated. **Either answer closes this work package.** A
      null result is written up as a result.
- [ ] **WP5 — canonical evidence and closure.** Run the registered gate command flagless at one
      exact clean commit, authenticate the artifacts, obtain independent review to zero blockers
      and zero should-fixes, and record every metric, value, host, command, commit and artifact
      hash in `PROGRESS.md`.

Later work packages — SDAK-active reproduction (labelled in-sample), the quantitative Fig 8.16
onset comparison (needs the column-seed ADR and per-entry PDF re-verification), and held-out
observables — are registered when they open, each with its own frozen protocol.

## Out of scope

- Calibration. Phase 6 is validation (decision 0003); tuning inputs to improve agreement is the
  one thing the freeze exists to prevent.
- ~~The 1D spherical reference solver.~~ **Moved into scope 2026-07-26 as WP3b** on the
  operator's accuracy-first priority: convergence studies establish self-consistency, and only
  an absolute anchor establishes correctness.
- Running the sweep on the float32 GPU port. Measured 6× slower than the CPU oracle at 28³, and
  unable to satisfy the frozen absolute `divTol = 1e-7` at all in sustained runs (it sits below
  the float32 roundoff floor). Reinstating it would need an ADR replacing that tolerance with a
  relative bound; the GPU may still serve as a labelled diagnostic cross-check, never as the
  primary or as a gate criterion.
- A `monopole-matched` third far-field condition (`docs/monograph-review.md`) — an ADR-level
  addition, not a Phase 6 deliverable.
- An elongated/column seed class, until the ADR that authorizes it for evidence use.
- Any Metal or general-WebGPU portability claim (ADR 0018), and any change to
  `PHASE5_PROTOCOL_SHA256`, the Phase 5 bundles, or accepted Phase 2–4 evidence.
- Phase 7 product work: smooth surfaces, materials, post-processing, gallery, export.
- Percent-level onset claims against the Nakaya schematic, or any claim that mixes σ semantics
  across reference entries.

## Tried and rejected

- **Run the sweep on the float32 GPU port.** Registered on 2026-07-26 and **retracted the same
  day on measurement.** The premise was that the GPU would be the same quality and faster.
  Neither held. Faster: at 28³ the GPU took 32.9 s against the CPU oracle's ≈5 s, because the
  CPU warm-starts and converges many interface steps in a single relaxation sweep while the GPU
  cannot submit fewer than a 16-sweep segment plus a queue sync; no size was measured where the
  GPU wins. Same quality: the GPU cannot satisfy the frozen `divTol = 1e-7` in sustained runs at
  all — refusals at 20³/24³/28³ showed a relaxation residual of exactly 0 and both ULP distances
  0, a bit-stationary float32 fixed point, with the divergence residual at 1.0–1.6e-7, a few ULP
  of the ≈0.596 operand magnitude. The tolerance is absolute and sits below float32's noise
  floor. Phase 5 had only certified this path for **four** interface steps at 24×24×18, so
  sustained running was never covered. Two lessons recorded rather than buried: an engine
  certified on one workload does not transfer to a different workload of different duration, and
  a plan sentence asserting one engine's necessity from the other engine's cost alone is not
  evidence. Additionally, sweeps are embarrassingly parallel across 16 CPU cores while the
  Phase 5 protocol permits one process per physical adapter — so the CPU wins on throughput too,
  by arrangement rather than by clock.
- **Choose the habit measurement size independently of the domain size.** Rejected on
  measurement: at 28³/extent 17 both engines produce a needle (aspect ratio 3.4) where Phase 2b
  at 96³/extent 61 produces a plate (0.119) at the same temperature and far field. Small
  domains are a different regime, not a coarser view of the same one, so domain convergence
  sets the measurement size rather than the reverse.
- **Carry the parameter uncertainty as stated systematics only.** Rejected under accuracy-first:
  the ±25% digitization bands are known to admit draws that reverse the cold-side ordering, and
  the σ₀ crossing sits at −6 °C in one source and −9/−10 °C in the set the solver uses. A result
  that flips between uncertainty-consistent draws is not a result, and prose cannot tell us
  which we have. Both axes are swept (WP4).
- **Make Libbrecht Figure 8.16 the primary comparison target and write an ADR deviating from the
  charter's "Nakaya's" wording.** Rejected on 2026-07-26 once Figure 1 of 1211.5555v1 was
  located: the project does own the classical diagram, the charter asks only for a qualitative
  crossing (§2.3), and taking Fig 8.16 first would have required both a deviation ADR and the
  column-seed ADR before a single sweep. Fig 8.16 remains the right *quantitative* target later.
- **Compare quantitatively against the Nakaya schematic.** Rejected: `docs/monograph-review.md`
  warns that the e-needle and classical diagrams' boundaries sit at visibly different `(T, σ)`,
  and "comparing against the wrong diagram would manufacture false disagreement". The schematic
  supports ordinal claims only.
- **Freeze the entire phase's protocol once, up front.** Rejected: the later quantitative and
  held-out work packages have requirements that are not yet known, so a single freeze would
  guarantee a post-freeze ADR and a full re-sweep. One registered protocol per sweep keeps
  pre-registration strict without pre-committing unknowns.
- **Keep Phase 6 as-is and rely on pre-registration alone to handle SDAK circularity.** Rejected
  by ADR 0005: "freezing a leaked input freezes the leak. Pre-registration binds future hands; it
  cannot unknow what the SDAK curves were built from."
- **Drop SDAK entirely to keep Phase 6 clean.** Rejected by ADR 0005: SDAK is the best available
  hypothesis for the extreme morphologies, and split reporting keeps the clean no-SDAK result
  *and* the hypothesis-bearing run.
- **Treat the 65% domain-contact guard as evidence of far-field independence.** Rejected by
  charter item 2 and `AGENTS.md`: it is a collision heuristic. Only a domain-convergence study
  speaks to boundary independence.
- **Pre-shape each sweep point's domain to its expected habit.** Rejected: sweeps cross habit
  flips by design, so shaping the box to a morphology that is not yet known biases the result
  ADR 0001 was written to protect.

## Open questions

These are recorded systematics, not blockers. Each must be carried in the Phase 6 report; none
may be discovered after the fact.

1. **The σ₀ crossing discrepancy.** 1910.09067 Figure 4 puts the raw-measurement crossing at
   T ≈ −6 °C; the monograph's CAK curves cross at (Tm−T) ≈ 9–10 °C. The solver uses the CAK set.
   `docs/libbrecht-parameters.md` requires this be carried as a stated systematic, and that the
   no-SDAK probe be run against **both** crossings before any conclusion about "the model".
2. **±25% digitization bands can flip the cold-side ordering.** Propagating the bands
   independently per anchor lets the −15 °C bands overlap, so uncertainty-consistent parameter
   draws exist in which the ordering reverses. No covariance information exists to exclude them.
3. **No `D(T)` law exists.** The solver, like the monograph's working table, treats diffusivity
   as temperature-independent at 1 atm. This bites hardest in exactly this phase's temperature
   sweeps.
4. **CAK-in-air vs CAK-in-vacuum.** The monograph is internally split; the choice is a stated
   Phase 6 systematic.
5. **Latent heating is unmodelled.** Ignoring it overestimates diffusion-limited growth by
   40–80% on the warm side. Whether a labelled correction enters the freeze list is a WP0
   decision.
6. **Registered σ∞ = 0.002 puts the cold half of a sweep in a dead-facet regime**, which makes
   "no column at −15 °C" partly predictable from regime placement alone. The frozen σ grid must
   address this — per-temperature σ scaled to σ₀(T), or a second registered point near
   0.01–0.02 — and the choice is registered in WP0, not decided after seeing results.
7. **Permanent model limits** (`docs/attachment-kinetics.md`): no latent-heat transport, no
   Gibbs–Thomson, no admolecule surface diffusion, no sublimation, seed placed rather than
   nucleated; plus intrinsic vicinal anisotropy (~10%, not removable by resolution) and a
   convergence-tolerance growth-rate bias.
