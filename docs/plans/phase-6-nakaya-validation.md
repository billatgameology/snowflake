# Plan — Phase 6: Validation against the Nakaya diagram

> **Phase 6 completed 2026-08-20.** The amended gate (decision 0045) was discharged by the flagless gate6 at exit 0; the WP5 preview-GPU cohort moved to Phase 7 by decision 0044. Statements of an active plan or open gate below are historical as of their own dates. See docs/PROGRESS.md and evidence/phase6-three-arm-report/report.md.

- **Phase:** Phase 6 — validation, not calibration (decision 0003)
- **Status (corrected 2026-08-01):** **SUPERSEDED as a live plan.** Both historical 204-row arms ran,
  but the Phase 6 scientific gate remains active and incomplete: the pre-registered
  conservative-intersection headline rule was never implemented (R15), and charter obligations
  (held-out validation; hundreds of preview-resolution GPU runs) were omitted. The science-first
  completion work is governed by
  [phase-6-science-first-completion.md](phase-6-science-first-completion.md). Unchecked work packages
  below are historical registration, not the current schedule. The line below is the ORIGINAL
  status and is retained as history.
- **Status (original):** registered, WP0/WP1 in progress. **No validation sweep runs until the freeze
  lands**, and the freeze now waits on convergence evidence rather than preceding it.
- **Started:** 2026-07-26
- **Last touched:** 2026-08-01 by OpenAI Codex (GPT-5)
- **Charter version at registration:** v1.16 (2026-07-24)
- **Revised 2026-07-26 on the operator's stated priority: accuracy to reality and science
  first; development and runtime speed secondary.** That priority changed five things, each
  recorded where it applies: the sweep runs on the **float64 CPU oracle** rather than the
  float32 GPU port; **domain convergence runs before the grid freeze** rather than after;
  measurement precision is spent on **temperature spacing near the boundaries** rather than on
  aspect-ratio resolution; the parameter **uncertainty is swept rather than narrated**; and the
  **1D spherical reference solver** returns as an analytic numerical check for its idealized
  spherical boundary-value problem, not a physical-accuracy certificate for faceted growth.

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
  able to move across it qualitatively"), §2.4 (the far-field condition must be **named in the
  frozen protocol**, and as of charter v1.17 the registered one is **monopole-matched** — the
  v1.2 mandate of fixed-σ Dirichlet was superseded on measurement by ADRs 0024/0027), §2.5 and §2.7 (provenance classes P1–P4; the in-sample/held-out
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
ADR and **makes that protocol's earlier sweep inadmissible for a replacement gate — the
replacement sweep re-runs in full**. Earlier executed bytes and measurements remain historical
evidence of their named superseded protocol.

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
  validation run uses the **monopole-matched** shell ([ADR 0024](../decisions/0024-monopole-matched-far-field.md));
  the fixed-σ Dirichlet runs that produced Phase 2b/4/5 evidence keep their own condition and
  are never pooled with sweep results.
- **Agreement is scored against distance from a reference boundary, and the band is frozen
  before the sweep.** The Nakaya figure is a *redrawn schematic* — WP1 measured a temperature
  axis that is not uniform and a supersaturation axis whose water-saturation curve sits 30–42%
  below Murphy-Koop — so its boundaries carry real uncertainty (±0.5 °C as digitized) and the
  model cannot be expected to place a flip more precisely than the reference locates it.
  Disagreement close to a boundary is therefore *expected* and is not evidence against the
  model; disagreement far from one is a genuine finding. Every reported point carries its
  distance to the nearest boundary, and the counts inside and outside the band are published
  separately.

  The band must be registered **before** any sweep runs, because applied afterwards the same
  rule becomes "the points that disagreed happened to be near a boundary" — exactly the
  post-hoc rationalisation the §3.2 freeze exists to make impossible. Its half-width is fixed
  by formula now and by number in WP0c once the T grid is frozen:

  > **ambiguity half-width = 0.5 °C (WP1's measured boundary uncertainty) + half the frozen
  > T-grid spacing.**

  It cuts both ways, and that is the point: a model that agrees with the diagram *only* near
  the boundaries has demonstrated nothing, because near a boundary both classes are plausible.
  The claim Phase 6 can earn is agreement in the interiors plus flips in roughly the right
  places — not boundary temperatures matched to a decimal the reference does not itself carry.
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

**Solver conformance to Libbrecht's correction of Kelly & Boyer — CHECKED 2026-07-27, conforms.**
`docs/stretch-sharing-and-investigation.md` reports (sweep-reported, arXiv:2306.13087) that
Libbrecht's technical correction requires two things: **relax the external field and the surface
boundary values simultaneously**, and **never invert the attachment coefficient as a function of
surface supersaturation**. Both were verified against `solver-cpu/src/lk-solver.ts` at HEAD:

- **Simultaneous.** `solveAggregateBoundary` is called from inside `sweep()`, per boundary cell,
  on *every* relaxation sweep — the surface values are re-solved together with the interior field
  rather than computed once after the field has converged.
- **Forward, never inverted.** The self-consistent pair is found by damped fixed-point iteration
  in the forward direction, `sigma_b <- sigma_opp / (1 + alphaHK(sigma_b)·Δx/X_0)`. `alphaHK` is
  always *evaluated at* a supersaturation; it is never solved backwards for the supersaturation
  that would yield a target coefficient. The iteration is damped by 0.5, converges to 1e-13
  relative, and is re-verified afterwards to 1e-9 with a throw on failure.

Incidentally confirmed in the same read: the boundary replacement is deferred to a second pass
over the boundary list, so an opposing pixel that is itself a boundary pixel cannot make the
result depend on boundary-list order — a D6h-safety property in the same family as ADR 0023.

No escalation needed; the aggregate `sigma_b` solve was simultaneous by design.

**Cross-platform reproducibility is a registered control.** IEEE 754 makes `+ − × ÷ √`
correctly rounded everywhere, but `Math.exp`, `Math.log` and `Math.pow` are not specified to be,
and this solver depends on them throughout (`pSatIce`, the attachment coefficients, `v_kin`).
Results may therefore differ in the last ULP across engine versions or CPU architectures. Phase
2b already pinned its exact Node/V8 build and declined any cross-engine bitwise claim. Phase 6
goes one step further and *tests* it: the same registered fixture runs on a second machine
(Apple M-series, arm64) and the habit classification is compared. **If a classification changes,
that conclusion was sensitive to low-order platform arithmetic and the finding is reported as fragile.** If
no second machine is available the claim is scoped to the registered host and says so.

## Pre-registration contents (WP0)

The freeze list is charter line 303 plus its amendments. WP0 is complete when every row below
has a registered value in a tracked protocol module, `docs/libbrecht-parameters.md` is frozen,
and the freeze commit is an ancestor of every execution commit that follows.

| Group | Frozen items |
|---|---|
| Comparison design | The T/σ grid; the crystal size at which habit is measured (habit is size-dependent, so a stated maximum dimension is what keeps comparisons apples-to-apples); metric thresholds; the uncertainty-reporting scheme |
| Physics inputs | `docs/libbrecht-parameters.md` in full; pressure; the parameter interpolation scheme (an open P4 choice today — see Open questions); noise amplitude; physical seed size |
| Boundary and domain | The named far-field condition — monopole-matched (charter §2.4 as amended v1.17, ADRs 0024/0027); domain budgets; Δx |
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
`divTol = 1e-7` is a *relative* divergence-identity tolerance, and in float32 it sits below the
roundoff floor: the probe recorded refusals at 20³/24³/28³ where the relaxation residual was
**exactly 0** and both ULP distances were **0** — a bit-stationary float32 fixed point, where
more sweeps provably cannot change anything — while the divergence residual sat at 1.0–1.6e-7,
a few ULP of the ≈0.596 operand magnitude. Refusals occurred at steps 11–47 with no monotonic
pattern in domain size, which is what a roundoff floor straddling a fixed threshold looks like.
Phase 5 only ever conformance-tested the GPU LK path at 24×24×18 for **four** interface steps,
so sustained GPU LK running is new ground rather than a regression.

> **Corrected 2026-07-27 (WP0c), and the conclusion gets sharper rather than weaker.** This
> paragraph called `divTol` an *absolute* tolerance. It is not: both engines compute
> `|injection + drift − exchange| / |exchange|` — `solver-cpu/src/lk-solver.ts` and the WGSL
> reduction in `solver-gpu/src/lk-shaders.ts` agree — so it is **relative**, normalized by the
> surface exchange. That makes the float32 result exact rather than approximate. The numerator is
> a difference of float32 accumulations of magnitude ≈ 0.596, so its rounding floor is about one
> ULP of that magnitude, and dividing by ≈ 0.596 puts the relative floor at about **one float32
> epsilon, 1.19e-7**. The frozen `divTol = 1e-7` therefore sits *below a single machine epsilon
> of the arithmetic being asked to satisfy it* — which is why the observed residuals cluster at
> 1.0–1.6e-7 and why no amount of extra sweeping helps. It is unreachable by construction, not by
> misfortune.

**Consequence:** the engine choice must be re-decided on this evidence, and running the sweep on
the GPU would first require an ADR replacing this tolerance with a bound that scales with the
arithmetic's own epsilon and the cell count — the shape decision 0014 already uses for smoother
drift. That is a protocol decision, not something a probe or a work package may substitute
quietly.

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

**4. The domain ladder (2026-07-26, v6 + monopole-matched, f = 0.15, measured at extent 15).**
Five domains per temperature, `symErr = 0` and `deltaSymClean = true` and every relaxation
converged at all ten points.

| N | warm −5 °C: attached / AR | cold −15 °C: attached / AR |
|---|---|---|
| 28 | 521 / 0.3810 plate | 1409 / 0.8381 neutral |
| 32 | 521 / 0.3810 plate | 1409 / 0.8381 neutral |
| 40 | 521 / 0.3810 plate | 1481 / 0.9905 neutral |
| 48 | 521 / 0.3810 plate | 1505 / 0.9905 neutral |
| 64 | 521 / 0.3810 plate | 1553 / 0.9905 neutral |

**The two metrics converge at different rates, and only one of them is the registered
criterion.** The aspect ratio — which is what classifies habit — is converged from N = 28 warm
and N = 40 cold, and the habit *class* is stable at every point. The attached count appears
**not** converged even at 64³ on the cold side: it climbs 1481 → 1505 → 1553 while `AR` sits
fixed at 0.9905.

> **Superseded 2026-07-27, and the conclusion reversed.** This ladder was run at extent 15, and
> the measurement extent was *then* chosen from the AR-vs-extent trajectories — so the two never
> composed, and domain independence was never demonstrated at the size actually registered.
> Re-run at extent 21 ([`research/phase6-convergence.md`](../../research/phase6-convergence.md)
> §1.2), the historical warm row was bit-identical and the last two sampled cold counts matched.
> That two-row ladder was later shown non-transferable: R15's registered multi-point check failed
> N = 48 and N = 64 at three of four points. No minimum domain or exact asymptote follows from this
> table; the replacement protocol must re-establish both at its registered configuration.

**The cold reading differs from the old equal-field coefficient proxy.** At −15 °C and f = 0.15
that proxy compares coefficients under one shared far-field-derived value; it does not predict the
coupled habit. Extent 15 measured `AR = 0.9905`, classifying neutral. The trajectories later ran to
extent 39: cold rises to 1.258 and flattens from extent 31, remaining neutral at every sampled size.
The size-development explanation was therefore only half right — the habit does develop
with size, 0.63 → 1.26, but it stops well short of the 1.5 column floor. Whether the model
changes under the replacement numerical controls is a live question. The historical measurement
size was **extent 21**, set by
the slowest-developing habit: a size adequate for the warm plate (extent 9) reads cold at 0.63
and would classify it **plate**, unlike its later sampled neutral class. That is enough to reject
the early measurement size for this historical row; it is not a domain-wide convergence claim.

Wall times are not recorded as costs here: the ladder ran up to thirteen jobs concurrently on
eight physical cores, so every second is contended by construction.

**5. The timestep (fill-CFL) ladder (2026-07-26, v6 + monopole-matched, f = 0.15, 48³,
extent 15).** Four timesteps spanning 8×, both temperatures.

| fill-CFL | steps warm | warm attached / AR | steps cold | cold attached / AR |
|---|---|---|---|---|
| 0.2 | 44 | 539 / 0.3810 | 91 | 1697 / 0.9905 |
| 0.1 | 87 | 521 / 0.3810 | 176 | 1505 / 0.9905 |
| 0.05 | 168 | 527 / 0.3810 | 342 | 1649 / 0.9905 |
| 0.025 | 333 | 521 / 0.3810 | 677 | 1649 / 0.9905 |

**Finite historical observation:** `AR` is identical at every sampled timestep at both
temperatures, so the 8× sampled change did not move the historical class criterion in these two
rows. Cold attached count runs 1697 → 1505 → 1649 → 1649 non-monotonically. The last two samples
are equal, but two equal terminal samples do not establish a limiting value; **cfl = 0.1 differs
by 8.7% from the equal 0.05/0.025 pair** while classifying identically. Warm spreads ~1% across
the sampled values.

**Historical consequence only:** in these two rows `cflFill = 0.1` left class unchanged but was
not adequate for attached-count quantities. The result does not transfer to R15's arms, sizes, and
representative cases; the replacement protocol must run its own timestep controls.

This ladder is also what caught the ADR 0024 `rho_far` defect: warm cfl = 0.2 originally
reported `deltaSymClean = false`. Re-run under the fix, **every value in the table above is
identical to the pre-fix run and only that one flag changed** to `true`.

**The inertness of that fix is now verified on 18 points, not argued.** The domain ladder was
also re-run and is **bit-identical across all ten points**; the timestep ladder is identical
across all eight but for the one broken flag. So a pre-fix run reporting a clean delta really
was clean, which is the same reasoning applied to v5 in WP0b — and it is now measured twice
rather than reasoned once. The grid ladder's six points all reported clean deltas and stand on
that verified argument without a third re-run, whose finest point costs ~6 hours.

**6. The expected no-SDAK result, registered BEFORE the sweep (2026-07-26).** The AR-vs-extent
trajectories (v6 + monopole, f = 0.15, 64³) are now complete to extent 39:

| extent | 9 | 13 | 17 | 21 | 25 | 29 | 33 | 37 | 39 |
|---|---|---|---|---|---|---|---|---|---|
| **warm −5 °C** | 0.378 | 0.439 | 0.337 | 0.382 | 0.413 | 0.423 | 0.419 | 0.371 | 0.405 |
| **cold −15 °C** | 0.631 | 0.750 | 0.938 | 1.105 | 1.190 | 1.160 | 1.222 | 1.276 | 1.258 |

Warm oscillates in a stable band ≈ 0.31–0.45 — **robustly plate from extent 9**, never near the
0.667 threshold, with lattice-discreteness swing that does not threaten the class. Cold rises
steeply to ≈ 1.25 and flattens from extent 31 — **neutral, and still not a column at extent 39**,
against a column floor of 1.5.

The interim reading above, taken while the runs were in flight, said cold "flattens near ≈ 0.95".
That was mid-rise: the value was still climbing and the final figure is a quarter higher. The
*class* it reported happens to be the right one, but it was right for the wrong reason, and the
correction matters because §4 of the convergence report extrapolates from this value.

> **STRUCTURAL ARGUMENT BELOW RETRACTED — 2026-08-01 adversarial review.** Lines in this historical
> registration that infer a habit-transition bound or sense from `sigma_0` crossings alone are
> unsupported and withdrawn. Even a restricted shared-field `alphaHK = A·exp(−sigma_0/sigma_surf)` comparison carries
> `A_prism`; actual habit depends on each facet's solver-produced field plus diffusion, geometry,
> seed, size and evolution. The registered CAK functions can have three
> `alphaHK` crossings over a narrow sampled surface-supersaturation band, and the ±25% anchor exercise
> below governs `sigma_0`, not habit. What remains is empirical: under the registered pure-class
> operator, each executed arm has two `plate→column` flips total across six constant-f ladders and no
> `column→plate` flip. Nothing below proves what every broad-facet model can or cannot produce.

**Historical expectation, retracted as a morphology inference.** The registered `sigma_0(T)`
curves have one nominal crossing, but that alone does not determine the coupled solver's habit or
transition sense. The complete attachment coefficient includes `A(T)` and the local surface field
is facet- and geometry-dependent. The original text below is retained only to show what was
pre-registered and subsequently invalidated by adversarial review.

Nakaya's figure, by its own caption, switches "plates (−2 °C) to columns (−5 °C) to plates
(−15 °C) to predominantly columns (< −30 °C)". Its boundary near −9.9 °C therefore separates
**columns on the warm side from plates on the cold side** — crossing it warm to cold gives
**column → plate**.

The nominal crossing lands within 0.1 °C of one digitized Nakaya boundary. The two original
consequences are both retracted:

1. ~~One crossing cannot reproduce three transitions.~~ Unsupported: the crossing counted the wrong
   quantity and does not bound morphology; the audit did not establish the opposite 3-D theorem.
2. ~~The transition sense is fixed and inverted.~~ Unsupported: the executed pure-class operator,
   not this curve comparison, is the admissible measurement.

**WP4 partial result (2026-07-27), and it separates the two claims sharply — no solver runs
required.** The σ₀ crossing is where the two curves are equal, so scaling BOTH by the same factor
cannot move it; only a differential can. Evaluating the registered curves at the ±25%
digitization band's edges:

| perturbation | basal/prism ratio at crossing | crossing |
|---|---|---|
| basal −25%, prism +25% | 1.667 | **−6.90 °C** |
| basal nominal, prism +25% | 1.250 | −8.50 °C |
| nominal | 1.000 | −10.00 °C |
| basal +25%, prism nominal | 0.800 | −13.70 °C |
| basal +25%, prism −25% | 0.600 | **−22.89 °C** |

**The crossing LOCATION is not constrained by the data.** Within the band already registered on
these anchors it can sit anywhere across a **16 °C span**, which covers essentially the whole
region between Nakaya's −3.3 °C and −21.5 °C boundaries. So the observation that the nominal
crossing lands within 0.1 °C of the −9.9 °C boundary is doubly worthless as evidence: it is
in-sample (the plan already forbids presenting it as a prediction) **and** it is a coincidence
inside an uncertainty that spans the diagram. Note too that the warm edge, −6.90 °C, sits near
the equality of the source-fit/model-inferred curves plotted in 1910.09067 Figure 4 (≈ −6 °C).
That equality and the monograph-table equality are input-function diagnostics, both inside the band;
neither is a morphology target or a direct measurement.

**The earlier robust-sense conclusion is retracted.** Constant whole-curve multipliers preserve
the nominal ratio's monotonicity, but the registered uncertainty is per anchor, not a single
multiplier, and even the ordering of `sigma_0` is not a habit theorem. The later corner enumeration
finds three `sigma_0` crossings in 65,536 of 262,144 independent lower/upper corners. The earlier
6,561/19,683 count is the equivalent census of unique relative-factor patterns after collapsing
the two equal-scale corners at each anchor.

**Corrected consequence for the report:** crossing location/count/sense of the two `sigma_0`
curves are function diagnostics only. The admissible result is the registered forward solver's
measured class/flip census with numerical controls satisfied; it supplies no universal bound.

Three things must be ruled out before this is asserted as a finding rather than an expectation,
and WP4 owns all three. The digitization is **not** one of the loose ends: σ₀_prism at −15 °C
carries an independent text-cited anchor ("σ₀ = 3 percent for a prism facet at −15 °C", printed
p. 144) that matches the digitized 3.2%, so the curves are not mislabelled.

- The **source-parameterization discrepancy already recorded** in `libbrecht-parameters.md` §3:
  the source-fit/model-inferred curves plotted in 1910.09067 Figure 4 are equal near −6 °C, while
  the monograph CAK curves are equal near −10 °C. A replacement comparison must execute the two
  complete, separately frozen attachment parameterizations; it must not turn either equality into
  a forward-run target.
- The **±25% digitization band** on σ₀, whose edges move the crossing.
- **What the coupled solver actually produces at f = 0.15.** The historical row is neutral, not
  column. That is a measured result of the complete field/geometry/kinetics calculation; no simple
  coefficient-order proxy establishes a parameter-predicted habit against which to assign blame.

**7. The historical grid-spacing ladder — non-transferable composition-changing diagnostic
(2026-07-27).** The runs used a fixed nominal physical box (16.8 µm) and measurement size at three
spacings, v6 + monopole, f = 0.15. Every point reported `symErr = 0`,
`deltaSymClean = true`, and converged relaxations. Changing spacing also changed the discrete seed,
site geometry, lattice realization and stopping composition, so these are not refinements of one
fixed physical problem and cannot establish grid convergence.

| Δx (µm) | N | extent | warm attached / AR | cold attached / AR |
|---|---|---|---|---|
| 0.700 | 24 | 9 | 67 / 0.3784 plate | 141 / **0.6307 plate** |
| 0.350 | 48 | 15 | 521 / 0.3810 plate | 1505 / **0.9905 neutral** |
| 0.2333 | 72 | 23 | 2325 / 0.4488 plate | 6951 / **1.0952 neutral** |

**Measured scope only.** The executed coarse cold composition classified plate while the two finer
compositions classified neutral; between 0.35 and 0.2333 µm, measured `AR` moved +10.6% cold and
+18% warm. Those differences show that the registered numerical answer was not stable across the
executed ladder. They do not isolate spacing as the cause, establish a convergence order, or license
a continuum extrapolation. The former first-order claim and h → 0 values 0.584/1.305 are withdrawn.

**The old crossing interpretation is withdrawn.** A σ₀ or equal-field coefficient-order swap is
not a coupled habit prediction. The measured historical cold class is neutral at the sampled
spacings; no continuum or parameter-implied class may be quoted from this composition-changing
ladder. R15 must measure a fixed-physical-size convergence trajectory.

**Consequence for WP0c.** The executed 0.2333 µm/N = 72 composition cost about six contended hours,
which is useful non-transferable cost reconnaissance. It cannot choose the R15 spacing or supply a
grid-bias systematic. The replacement design must hold the physical seed/size/problem definition
fixed, run its registered spacing ladder, and treat resource cost only as a scheduling input.

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
      with run length.

      **Confirmed at the Phase 2b scale (2026-07-26).** Re-running Phase 2b's −15 °C column
      condition (96³, σ∞ = 0.002, extent target 61, fixed-σ Dirichlet) under v6 reproduces the
      accepted v5 evidence **exactly**: step 330, attached 1,159, extent 61, `AR = 12.2000`,
      `symErr = 0`, `deltaSymClean = true` — every published digit. This is the strongest
      available check that ADR 0023 is an ordering change rather than a physics change: an
      independent hours-long run at the largest scale the project has used, reproducing
      accepted evidence bit for bit.

      The matching −5 °C plate condition was **started and then deliberately killed**, and is
      recorded here as a non-result rather than quietly dropped. It reached growth step ~174 of
      the ~814 Phase 2b needed after 2.3 hours, with a projected 12–24 h to finish, and its value
      had fallen: the −15 °C run had already delivered the reproduction check, and this one used
      the fixed-σ Dirichlet shell that ADR 0024 supersedes, so its aspect-ratio trajectory could
      not inform WP0c. It was occupying a core that WP3's remaining ladders need. Its last
      logged state was step 160, extent 19, `AR = 0.166667`, `deltaSym = true` — consistent with
      the Phase 2b plate it was heading toward, but **it is not a reproduction and must not be
      cited as one**. Confirming the warm half is a candidate for a later low-priority re-run.

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
- [x] **WP3 — historical numerical reconnaissance. Completed 2026-07-27; superseded for R15**:
      [`research/phase6-convergence.md`](../../research/phase6-convergence.md). Grid, timestep and
      domain convergence studies at representative conditions, reported with deltas. Registered
      historical outcomes included extent 21 and `cflFill = 0.1` leaving class unchanged in two
      rows while attached count differed. The old N = 48 domain selection is withdrawn: R15 later failed it
      at three of four registered points. The Δx ladder is non-transferable because each spacing
      changed the discrete seed/site/stopping composition; its measured class and `AR` differences
      do not establish a spacing-caused flip, convergence order or continuum value. Two corrections came out of it: the first domain ladder was run at the wrong
      measurement extent and its conclusion reversed when re-run at the right one, and ADR 0024's
      ratio-based validity limit was disproved (erratum logged; the governing quantity is not
      identified, so a domain budget must be measured per configuration and never extrapolated).

      **Historical representative-condition rationale — coefficient proxy only, not a habit
      mechanism.** The original selection used two heuristics:

      1. *Not too high.* Under a shared prescribed surface field,
         `alphaHK = A·exp(−sigma0/sigmaSurface)` approaches A as the field grows. The executed v6
         calibration at −5 °C measured `AR` 0.471 → 0.606 → 0.740 (plate → plate → neutral) as f
         went 0.15 → 0.50 → 0.90. That is an empirical row, not proof that coefficient contrast
         alone selected those habits.
      2. *Not too low.* `monograph-review.md` §2.5 records that at −15 °C with the Phase 2b
         `sigmaInfinity = 0.002`, the far-field barrier ratios are 12 and 16, giving equal-field
         facet-coefficient diagnostics of order 6e−6 and 1e−7 against the rough-site unit closure.
         The actual facets use solved boundary fields, so these numbers do not prove that rough-site
         geometry, step flow or hole filling selected the observed Phase 2b column.

      The following ratio is therefore only an **equal-shared-field coefficient diagnostic**. The
      coupled solver does not give basal and prism facets one common field: each `alphaHK` uses its
      own solved boundary value, and diffusion, geometry, topology, filling and hole closure all
      enter morphology. The diagnostic cannot select habit without the 3-D run:

      | T | sigma0 basal | sigma0 prism | equal-field `alphaHKBasal/alphaHKPrism`, f=0.15 | f=0.50 | f=0.90 |
      | --- | --- | --- | --- | --- | --- |
      | −5 °C | 0.00700 | 0.00270 | **0.56** | 0.84 | 0.91 |
      | −10 °C | 0.01400 | 0.01400 | **1.00** | 1.00 | 1.00 |
      | −15 °C | 0.02400 | 0.03200 | **1.40** | 1.11 | 1.06 |

      Within that restricted diagnostic, ratios move toward the prefactor ratio as f rises, their
      ordering differs between −5 °C and −15 °C, and the two barriers are equal at −10 °C. None of
      those statements maps coefficient order directly to plate/column class or predicts a habit
      transition. The −10 °C equality is a property of source/project input curves, not model output;
      failure of a 3-D flip cannot be assigned uniquely to solver rather than parameters.

      The historical water-relative ladder chose f = 0.15 because it maximized this proxy contrast:
      `sigma0/sigmaInfinity` is 0.93/0.36 at −5 °C and 1.02/1.36 at −15 °C. That choice is now
      non-transferable and cannot select R15 conditions. It was also the expensive end—the
      calibration's f = 0.15 cold points exceeded a 300 s budget at 48³. Runs at
      `sigmaInfinity = 0.002` are retained as a numerical
      cross-check against Phase 2b's known answer, labelled as such, and are **not** the
      representative-condition study.

      **The far-field bias has a closed form, it is large, and it is the leading candidate for
      the regime change.** `monograph-review.md` §2.4: the fixed-σ Dirichlet shell holds σ∞ at
      finite radius and over-supplies vapor increasingly as the crystal grows, and the
      finite-outer-boundary spherical solution (Eqs. 3.33–3.36) gives that bias in closed form.
      Transcribing it for WP3b turned up an **erratum in the printed Eq. 3.35** — its
      denominator should be the attachment coefficient, not X₀/R — caught by three mutually
      consistent cross-checks of the same equation and recorded in
      `docs/libbrecht-parameters.md` §1.1. The correction matters here
      rather than being a curiosity: the printed form makes the bias a few percent and
      *independent of crystal size*, while the corrected form makes it grow toward
      [1 − R/R_far]⁻¹. On the corrected estimate a measurement at extent 17 carries ~46% bias at
      48³ and ~19% at 96³, and Phase 2b's own extent-61-in-96³ configuration sits near **160%**.

      So the domain ladder is load-bearing, the bias falls only as ~1/N, and the monopole-matched
      far field becomes a substantive candidate rather than a refinement. **It has since been
      implemented and measured** ([ADR 0024](../decisions/0024-monopole-matched-far-field.md)):
      growing the same crystal for 60 steps, the fixed-σ shell gives 291 attached cells at 28³
      against 279 at 40³ — a 4.1% swing from domain size alone — while the monopole shell gives
      231 at both, with an identical aspect ratio. It is not a free lunch: it moves the habit
      metric (AR 0.500 → 0.300 on that comparison), so **no threshold measured under the
      Dirichlet shell transfers**, and it has its own validity limit — 24³ through 48³ agree but
      20³ does not. The ADR attributed that to Eq. 5.30's point-source approximation, i.e. to the
      ratio `rho_far/R`; **WP3 disproved the attribution** (the break is at ratio 1.74 while the
      extent-21 ladder is exact down to 1.24, and every other candidate anti-predicts too), so the
      governing quantity is unidentified and a domain budget must be **measured per configuration
      and never extrapolated**. The ladder still sets the minimum domain; monopole matching moves
      that minimum outward rather than removing it. It also revives the
      explanation for 28³-needle versus 96³-plate that the first version of this note had ruled
      out on the strength of the printed formula. The estimate stays an order-of-magnitude tool —
      it is isotropic, identifies R with extent/2, and cannot express the **differential**
      per-facet bias that a plate's prism tips (much nearer the wall than its basal faces) would
      feel — so the ladder measures the effect and the closed form only sets the expectation.

      The domain study
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
- [ ] **WP4 — historical framing withdrawn; do not execute this work package.** It incorrectly
      promoted two `sigma_0` equalities into run targets and described one as a raw-measurement
      crossing. A replacement protocol must compare the complete separately frozen attachment
      parameterizations, propagate registered input uncertainty through forward solver artifacts,
      and derive habit only from those artifacts. It must not score or target either equality.
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
  unable to satisfy the frozen `divTol = 1e-7` at all in sustained runs — the tolerance is
  relative, and 1e-7 is below one float32 epsilon (1.19e-7) of the arithmetic asked to meet it.
  Reinstating it would need an ADR replacing that tolerance with one that scales with the
  arithmetic's own epsilon; the GPU may still serve as a labelled diagnostic cross-check, never
  as the primary or as a gate criterion.
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

1. **The source-parameterization discrepancy.** The source-fit/model-inferred curves plotted in
   1910.09067 Figure 4 are equal near T ≈ −6 °C; the monograph's CAK curves are equal at
   (Tm−T) ≈ 9–10 °C. These are input-function diagnostics, not measured morphology boundaries.
   Any replacement comparison must run the complete separately frozen parameterizations and carry
   their provenance; it must not run “against” either equality.
2. **±25% digitization bands can flip the cold-side ordering.** Propagating the bands
   independently per anchor lets the −15 °C bands overlap, so uncertainty-consistent parameter
   draws exist in which the ordering reverses. No covariance information exists to exclude them.
3. **No `D(T)` law exists.** The monograph's working table supports a temperature-independent
   approximation in air but does not pin that row to exactly 101325 Pa. The solver applies it under
   the project's P2 exact-one-atmosphere closure. This bites hardest in exactly this phase's
   temperature sweeps.
4. **CAK-in-air vs CAK-in-vacuum.** The monograph is internally split; the choice is a stated
   Phase 6 systematic.
5. **Latent heating is unmodelled.** Ignoring it overestimates diffusion-limited growth by
   40–80% on the warm side. Whether a labelled correction enters the freeze list is a WP0
   decision.
6. **Historical far-field proxy warning; habit inference retracted.** At `sigmaInfinity = 0.002`,
   evaluating broad-facet inputs against that shared far-field value gives weak attachment values
   over much of the cold range. It does not establish facet-local solved fields, a “dead-facet
   regime,” or a coupled no-column prediction. A replacement supersaturation grid must be sourced
   and frozen before execution, not changed after seeing results.
7. **Permanent model limits** (`docs/attachment-kinetics.md`): no latent-heat transport, no
   Gibbs–Thomson, no admolecule surface diffusion, no sublimation, seed placed rather than
   nucleated; plus intrinsic vicinal anisotropy (~10%, not removable by resolution) and a
   convergence-tolerance growth-rate bias.
