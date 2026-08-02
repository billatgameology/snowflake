# Phase 6 — the historical CAK measured sweep (arm 1 of 2)

> **ARM 2 HAS RUN. Read [phase6-two-arm-report.md](phase6-two-arm-report.md) instead, or first.**
> This document is arm 1 alone and was written when arm 2 was still hypothetical; its "the Phase 6
> conclusion is deliberately not drawn here" is now discharged there. Everything measured below
> stands unchanged — 3/90, the per-regime table, the class totals, the artifact hashes. What
> changed is that the comparison it was waiting for exists: **M1 versus CAK is a trade** (66
> neutral→plate conversions and 20 of this arm's 30 columns lost), but it is not an SDAK-only
> ablation because the broad forms and `A_prism` also change; **neither arm produces a column
> in the Nakaya `columns` regime AT THE REGISTERED MEASUREMENT SIZE**; and the sampled AR spacing
> near the class thresholds at that size is now measured (36 distinct values in 408 rows), which changes
> how the near-threshold statements in §"What this does NOT establish" should be read.
>
> **That middle clause was unqualified when this pointer was written, and it is now corrected.** A
> predeclared but non-gated size diagnostic measured arm 2 producing a **`column`** at −5 °C,
> f = 0.10 at extent 29 instead of 21 — AR 1.40000 → **1.52632** — while this arm measured 0.851852
> at the matched larger size. The full P1 ladder is **non-monotone** (1.40000 → 1.52632 → 1.52174 →
> 1.64000), registered outcome 4, not the previously claimed outcome 1 or size convergence. N = 64
> versus N = 80 reproduces P1's AR/class at extents 29, 35 and 41, but the registered attached-count
> criterion fails at extent 35. The comparison is a controlled diagnostic, not gate evidence or a
> priority result. Nothing in this document's measured-only tallies moves.

---

> ## ⚠ RETRACTION — Finding 1's structural proof is invalid (2026-07-29)
>
> **Finding 1 below, and the crossing counts it cites, are retracted.** An adversarial audit corrected
> the numeric crossing count and invalidated the claimed structural proof; the document author then
> separately recomputed the counterexample. That follow-up is not claimed as Rule 10-independent
> review. The measured results in this report — the
> 3/90 headline, the per-regime table, the class totals, the diagram, the artifact hashes — are
> **unaffected**. What is retracted is the *interpretation*.
>
> - The bound was computed on **σ₀** crossings. A restricted equal-field attachment-order comparison
>   uses `alphaHK = A·exp(−σ₀/σ_surf)` and carries `A_prism`; actual habit additionally depends on
>   facet-local solver fields and coupled geometry/evolution. With `A_prism` included, the printed
>   broad-facet set has **three** equal-shared-field `alphaHK` equality events
>   (`sigmaSurf` ≈ 0.199–0.399 %) and the registered `CAK`
>   set has three for a shared σ_surf ∈ [0.00247, 0.00366]. Two of the 204 sigmaInfinity inputs
>   numerically lie in that interval; neither is a measurement or bound on facet-local sigmaSurf.
> - For unequal-prefactor CAK, the restricted equal-shared-field count depends on the selected
>   shared σ_surf. Unit-prefactor M1's restricted equality locations do not; neither calculation
>   transfers to the generally unequal facet-local fields or determines coupled habit.
> - The M1 count of five crossings is wrong under the project's registered P4 transcription: the
>   source leaves `log` unspecified, and the Figure-1-width-supported base-10 reading gives
>   **three** at approximately 3.08 / 8.07 / 24.73.
> - Three σ₀ crossings are also reachable **inside** the registered ±25 % per-anchor digitization
>   band (65,536 of 262,144 independent lower/upper corners; equivalently 6,561 of 19,683 unique
>   relative-factor patterns after collapsing the two equal-scale corners at each anchor), so
>   "the count is invariant under the band" is false.
>   the historical Phase 6 plan's structural-bound section already recorded this while another
>   section claimed the opposite — a self-contradiction preserved and superseded in that plan.
>
> **What survives.** The far-field proxy diagnostic has one equal-field coefficient-order swap at
> f = 0.10 and none at every larger sampled `f`; it is not a measured solver `alphaHK` reversal.
> Separately, the historical pure-class habit
> operator measures at most one flip per sampled ladder. Neither count is a structural bound on
> habit transitions. *This parameterization did not reproduce the Nakaya comparison under the
> executed measured-only protocol* stands; the claim that **no** broad-facet parameterization
> *could* does not.
>
> Other surviving audit findings against this document: §"What this is a test OF"'s −5 °C reframing
> is cherry-picked (3 of 6 points in this sweep's own −5 °C row exceed ρ > 1 and none is a plate);
> the claim that `CAK` and `CAK_A1` are "the same model" in `plates-cold` is falsified by the two
> `points.json` files; and Finding 5's σ-contrast figures are `CAK_A1` values.

The registered 204-point sweep, run to completion against the frozen protocol under the registered
parameter set `CAK`.

**Status corrected 2026-08-01:** this is one historical arm of a completed two-parameterization
measurement, not a completed Phase 6 gate. The paired M1 artifact exists and is reported in
`phase6-two-arm-report.md`; R15, GPU, matched dip ablation and held-out obligations remain open.

**Historical-plan WP5 independent verification HAS run (corrected 2026-08-01, external review).**
The verifier re-derives all 204 rows importing nothing from `runner/src` and returns PASS; seven
negative controls executed, 5 CAUGHT and 2 GAP. The active science-first plan's WP5 is the still-open
preview-budget GPU cohort. These are valid *measured-only* counts, not registered headline verdicts:
the pre-registered conservative-intersection rule was never implemented (pin-register R15), so the
registered scientific gate is incomplete. See `phase6-conclusion.md`.

**Review provenance and limits.** The 2026-08-01 adversarial claim review used OpenAI
`gpt-5.6-sol` at ultra reasoning with the current request/handoff context and no Phase 6 authorship.
It independently re-executed the artifact verifiers, diagram reconciliation, flip census, ladder
reader, direct JSON counts/fragility/f = 0.90 comparison and live fingerprint. It did not re-run the
long solver jobs, GPU/held-out campaigns, establish numerical convergence, audit `docs/education/**`,
or run complete `npm test`.

## Provenance

| | |
|---|---|
| protocol | `8aeb2b80a5d85357bca1ddbf7301e63ea7b53e714e4bc5ce290ac22e1b16698e` (25 freeze rows) |
| parameter set | **`CAK`** — registered as a freeze row by ADR 0031 |
| execution commit | `390fe35a049e6da391c429c1f446fb2ca2cdb931` |
| freeze commit | `e2f1bfcab4cf605f5c9c44ad096d8b1bcc0fe967` — **verified an ancestor of the execution commit** |
| engine | Node v24.13.1, V8 13.6.233.17-node.40, float64 CPU oracle |
| command | `node runner/src/main.ts phase6-sweep 6` |
| exit | 0, 204/204 points, ~20 h wall on 6 workers |

| artifact | bytes | sha256 |
|---|---|---|
| `points.json` | 129,760 | `0ed613bce61e44829f722e069a818e0da4981ecd34829b0b49eaba15e11cf89a` |
| `report.json` | 928 | `71ae094c38778b0d2c62f3952e4ca641c0bc8f5d91b350248c5c78800830f2a9` |
| `diagram.svg` | 31,193 | `40458703061af5b54d6629484aa84762fb995a15f5443904c3462d2ff5939234` |

Artifacts live in the TRACKED evidence tree `evidence/phase6-sweep/`; their hashes are the tracked
record, as for research media under decision 0004. The preflight refused to produce any of it until
the freeze was complete, the manifest hashed to the registered pin, the freeze commit was an
ancestor of HEAD, and the tracked tree was clean.

### What this replaces, and why

An earlier 204-point sweep at commit `6995868` (protocol `9aa2e7c1…`) scored **5/90** and is
**invalidated by ADR 0031**, not merely superseded. It ran `CAK_A1`, in which `A_prism ≡ 1`, while
`PHASE6_INTERPOLATION` registered `aPrism: "piecewise-linear-in-(Tm-T)"` — distinct from
`aBasal: "constant-1"`. The runs violated a registered freeze row, because the harness emitted no
`--param-set` and the CLI default supplied `CAK_A1`. Its artifacts are preserved unmodified at
`evidence/phase6-sweep-6995868-cak-a1-superseded/`.

**A verification hazard found while this sweep ran, and still not closed.** The harness captures
provenance at endpoints, but each child executes `runner/src/main.ts` from the **working tree** and
inherits the parent process environment. Endpoint source checks found no relevant committed diff,
but cannot exclude a transient edit reverted before completion; an external `NODE_OPTIONS` loader
can also alter execution while Git remains clean. R15 must use an immutable source snapshot and an
explicit environment allow-list, with exact argv/environment/source identity retained per child.

## What this is a test OF

**CAK failing to reproduce the Nakaya diagram is consistent with Libbrecht's published
expectation for broad-facet kinetics, not a discovery of this project.** He states (arXiv:2306.13087
p5):

> "the SDAK phenomenon provides the only viable option currently available that can adequately
> explain the Nakaya diagram together with a plethora of other ice-growth data."

The earlier sentence calling this the first independent 3-D test is withdrawn: no current exhaustive
priority search was preserved, this measured-only arm does not discharge the registered gate, and
the supported experimental geometry differs from the free lattice crystal. The sweep remains a
reproducible measurement of the named CAK parameterization at its executed configuration.

**And the source is more specific than that at −5 °C.** The dedicated measurement paper
(arXiv:1912.03230 p10, quote verified at source) says a plate is the *correct* broad-facet output
there:

> "the new data directly confirm the growth of plate-like simple prisms at -5 C when 𝜎_surf is
> low … **Producing columnar crystals at -5 C then requires the SDAK effect** to increase 𝛼_basal
> compared to its value on broad basal facets."

His own −5 °C substrate experiments found `0.1 < ρ_aspect < 1` with "Columnar crystals (with
ρ_aspect > 1) **were absent**" and "many blockier, nearly isometric" (p13).

> **CORRECTED 2026-07-29.** Two things were wrong here. (i) `ρ_aspect = H/R` equals our `AR` only if
> his `R` is the circumradius; our `tExtent` is the corner-to-corner diameter, so an equal-area
> radius would make ρ ~10% larger. He does not define it, so the equivalence is **unverified**.
> (ii) The claim that "this arm is expected to reproduce his broad-facet measurements" is
> **WITHDRAWN**: this sweep's own −5 °C row is AR 0.7895 / 1.0000 / 1.0000 / 1.1053 / 1.2353 /
> 1.3125 — **all six neutral, three above his ρ > 1 threshold, not one plate.** He found plates and
> no columns; the model produces neither. The honest statement is that at −5 °C the model produces
> **no habit at all**, disagreeing with the diagram *and* with his measurements. Note also that the
> same paper reports columns at −5 °C in free fall and on a substrate started at high σ∞ (p16), so
> his position is conditional on growth history rather than a flat "no columns". See
> `libbrecht-figure-findings.md` §10.1.

## The measured diagram

`P` plate (`AR ≤ 0.6667`) · `.` neutral · `C` column (`AR ≥ 1.5`). Columns are temperature in °C
(sign dropped), rows are σ∞ as a fraction of water saturation.

```
     T:  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30 31 32 33 34 35
f=0.10:  P  P  P  .  .  .  .  .  .  .  .  .  .  .  .  .  .  C  C  C  C  C  C  C  C  C  C  C  C  C  C  C  C  C
f=0.15:  P  P  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  C  C  C  C  C  C  C  C  C  C  C  C  C
f=0.25:  P  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .
f=0.40:  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .
f=0.60:  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .
f=0.90:  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .
```

Reference regime boundaries sit at −3.3, −9.9 and −21.5 °C.

## Scored result

Scoring is ADR 0025's, registered before either sweep: `neutral` counts as disagreement (the
reference names a habit in every regime; the neutral band is ours, not the reference's), `invalid`
is excluded by name, the ±1.0 °C ambiguity band is excluded from counting, and the mixed cold
regime is reported but kept out of this historical measured-only scope because it accepts both pure classes.

> ### **Measured-only agreement: 3 of 90 scored points.**

| regime | headline | raw n | ambiguity-excluded headline n | agree | raw neutral |
|---|---|---|---|---|---|
| `plates-warm` (T > −3.3) | yes | 12 | 6 | **3** | 7 |
| `columns` (−3.3…−9.9) | yes | 36 | 24 | **0** | 35 |
| `plates-cold` (−9.9…−21.5) | yes | 72 | 60 | **0** | 69 |
| `columns-and-plates` (< −21.5) | no | 84 | 0 | 27/84 raw; 26/78 after ambiguity exclusion (reported only) | 57 |

Class totals over all 204 points: **6 plate, 168 neutral, 30 column, 0 invalid.**
16 points are flagged extent-fragile.

The `raw n` and `raw neutral` columns include boundary-band rows; the headline denominator and
headline agreement exclude them. The mixed cold regime is not in the headline, so both its raw
27/84 and ambiguity-excluded 26/78 diagnostic counts are shown explicitly rather than mixed.

**All three agreements are at −2 °C**, the single counting temperature in the warmest regime —
which ADR 0025 registered *pre-sweep* as carrying essentially no statistical weight, precisely so
this could not be presented as a result. The model agrees with the reference nowhere else inside
the headline scope.

### The registered prediction, and how it did

ADR 0031 recorded, **before this sweep ran**, that correcting the parameter set was expected to
*lower* the headline from 5/90 to **approximately 2/90** — written down in advance so the
parameterization could not later be chosen by its score.

**Outcome: 3/90.** Direction correct, magnitude one point pessimistic. The estimate came from
interpolating two calibration probes (a 1.75× A_prism throttle produced a 1.36× AR rise at −8 °C; a
5.6× throttle produced 2.62× at −5 °C), which put a 3.6× throttle at −2 °C near 1.9–2.2×.

Measured rises at −2 °C, computed from the two `points.json` files:

| f | `CAK_A1` AR | `CAK` AR | rise | |
|---|---|---|---|---|
| 0.10 | 0.1638 | 0.2632 | 1.607× | held |
| 0.15 | 0.2729 | 0.3684 | 1.350× | held |
| 0.25 | 0.3821 | 0.6004 | 1.571× | held, **extent-fragile** |
| 0.40 | 0.4913 | 0.7096 | 1.444× | **lost** |
| 0.60 | 0.6004 | 0.8188 | 1.364× | **lost** |

**1.35–1.61×, against the 1.9–2.2× predicted** — the two-point interpolation ran hot, which is why
three agreements survived instead of two. The rise is also not monotone in `f`, so a single
throttle-to-rise factor was the wrong model for it; the probes happened to sample the two ends.

## Findings

**1. No sampled return under the registered flip operator.** Scanning each constant-f ladder warm
to cold while skipping neutral rows, CAK has one `plate→column` flip on 2 of 6 ladders, none on the
other 4, and no `column→plate` flip. The paired M1 artifact has the same flip counts under that
operator. The reference has three boundaries. This is a scoped measurement of twelve ladders, not
the retracted structural theorem: habit depends on full `alphaHK`, diffusion sets the surface field,
and no crossing-count bound follows for every parameterization or condition.

**2. Zero invalid runs in 204, in both sweeps.** Every point passed the per-run elliptic dual
criterion, held `symErr = 0` with noise off, kept every per-tick attachment delta D6h-invariant, and
cleared the 65% domain-contact guard. Those checks make the rows admissible under the historical
measured-only protocol; they are not grid-, timestep- or domain-convergence evidence. Nothing was
excluded from that artifact.

**3. The observed end of the plate class is not a coefficient-equality event or a column onset.**
In the CAK artifact, the last sampled plates occur at −4 °C (f = 0.10), −3 °C (f = 0.15) and
−2 °C (f = 0.25); the first sampled columns do not occur until −19 °C (f = 0.10) or −23 °C
(f = 0.15). There are 14 intervening integer-temperature neutral rows at f = 0.10
(−5 through −18 °C; a 15 °C endpoint gap) and 19 at f = 0.15 (−4 through −22 °C; a 20 °C
endpoint gap). Those are artifact-derived class
boundaries. A nominal `sigma_0` equality, or an `alphaHK` equality evaluated at one shared positive
field, is a different analytic quantity and does not locate either morphology boundary. The source's
strong-inequality condition for columns is consistent with distinguishing equality from a developed
habit, but it does not predict these artifact boundaries by itself.

**4. Correcting A_prism shrank the plate region and widened the neutral band.** Under `CAK_A1`
plate held to −8/−9 °C across f = 0.10–0.40; under `CAK` it reaches only −4/−3/−2 °C and vanishes
entirely at f ≥ 0.40. The cold-end column onset stays at −19/−23 °C, which is consistent
with—but does not follow deductively from—`2009.08404v2` Fig. 2's statement that
`A_basal ≈ A_prism ≈ 1` between −10 and
−30 °C, so the two parameter sets ~~are the same model there~~ **nearly coincide from about −15 °C
colder**. Measured: 11 of the 72 points in −10…−21 °C differ, max |ΔAR| = 0.1092, and `A_prism` is
0.830 at −10 °C rising to 1 only at −15 °C. **No `plates-cold` point changed class**, which is what
the 0/60 result rests on.

**5. Higher sampled supersaturation coincides with fewer pure classes over most of the CAK grid.** Columns
occur only at f = 0.10 and 0.15. **At f = 0.40, 0.60 and 0.90 the model produces nothing but
neutral across all 34 temperatures** — under `CAK_A1` that was true only at f = 0.90. This was
anticipated by a far-field coefficient-ratio proxy (`alphaHK = A·exp(−sigma_0/sigmaSurf)` tends
toward `A` as a shared positive `sigmaSurf` rises), but the proxy does not establish the cause of the
coupled 3-D outcome. The measured statement is the class census above. The reference diagram is at
its most structured in those sampled rows — dendrites, sectored plates and needles.

## What this does NOT establish

- **It is not a test of SDAK.** Every run used the registered broad-facet `CAK` configuration; that
  configuration contains no narrow-facet dip closure. Under ADR 0005, comparing the later M1 source
  model against the diagram used to construct its dip locations is in-sample. Neither this arm nor
  the confounded CAK→M1 comparison identifies a causal SDAK contribution. A matched forward ablation
  is required to isolate the implemented dip factors' effect on this solver under a frozen
  configuration; it cannot establish physical SDAK causality or necessity in nature.
- **Three source-motivated limitations are absent from this arm**, per
  `research/libbrecht-figure-findings.md` §10.2: a width-dependent nucleation barrier whose
  controlling terrace width is **~50 nm against this grid's 350 nm cells**; a fast-growth transient,
  since at −5 °C "both platelike and needlelike crystals can grow under essentially identical
  conditions", which motivates a population-aware comparison rather than treating one run as the
  whole distribution; and a background gas. The current pressure input changes `D` and therefore
  transport only. It does not implement pressure-dependent attachment kinetics or an
  edge-sharpening instability, so an in-air setting cannot support either inference. This list does
  not prove that every omitted item is necessary or that no deterministic score could fit a more
  tightly controlled experiment.
- **CORRECTED — the earlier claim that our `sigma_0_prism` was "low by 1.6–3.2× at −2…−5 °C" is
  REVERSED.** The dedicated papers infer source-fit values `sigma_0_prism = 0.03%` at −2 °C and
  approximately 0.2% at −5 °C; these are model-conditioned fit parameters, not direct
  measurements. Our digitized anchors are 0.028% at −2 °C (6.7% low) and 0.27% at −5 °C
  (35% high; a 0.07-percentage-point absolute difference from the approximate source fit).
  `2306.13087v1` M2 is ×3.01 and ×2.14 relative to those source fits, while
  `2009.08404v2` Eq. 3 is ×1.07 and ×1.54, respectively. Its Eq. 5
  reproduces our digitized `A_prism` anchors to 8.4% worst. The earlier same-source discrepancy is
  not the claimed uniform factor-of-1.6–3.2 low bias, but neither is it uniform ~7% agreement;
  this is a same-lineage transcription/provenance check, not independent physical validation.
- **CORRECTED — seed shape IS class-changing in the five-seed probe.** The earlier statement that it was "a large
  systematic, though not a class-changing one" was based on two seed thicknesses. A five-seed probe
  found a needle-like seed produces a threshold-classified **column (AR 1.6154) at −15 °C, where the reference
  requires a plate**. Seed geometry moves AR by +0.41 (−5 °C) and +0.51 (−15 °C) — but in the *same
  direction at both*, while the two bands demand opposite moves. None of the five sampled seeds
  agreed at either sampled condition; this does not rule out every temperature-independent seed.
- **Habit is measured at extent 21, and selected points show size sensitivity.** The historical
  one-sided rule flags 16 points below a threshold. Applying the same 0.135 distance strictly above
  a threshold adds 42 rows (58 total); the closed symmetric audit includes one row exactly on a
  threshold and adds 43 (59 total). Both counts are reported because the difference is threshold
  equality, not a scientific disagreement. The four-point ladder changes crystal extent and, in its main rungs,
  domain together; it is diagnostic and non-monotone, not a regime-wide physical-size or numerical-
  convergence study.
- **Tracked cross-platform evidence covers the Tier 1 fingerprints.** They differ in 9 of 448
  entries, at 1–31 ULP (`2a9f64b3` versus `3662b9e2`). A historical table reports four matching CAK
  output rows, including the AR = 1.5000 tie, but the raw arm64 logs and exit records were never
  tracked and are unavailable here. No end-to-end, other-CAK-row or M1 portability result is
  independently rederivable. See `docs/phase6-cross-platform-control.md` §Result.
- **The comparison target is a redrawn 1954 schematic** whose supersaturation axis WP1 measured as
  failing an independent check, which is why only its three boundary temperatures are used.
- **The 206-observation alternative cannot substitute for it in the bands that matter.** With the
  supersaturation convention now settled as ice-relative (verified in arXiv:1211.5555 p2 and the
  monograph p59), that data set's rows are 7–150 % while this sweep's executed σ∞ spans
  0.20–36.63 %. There is **no overlap at all warmer than −8 °C** — the whole `plates-warm` regime
  and most of `columns`. It also seeds every crystal on a c-axis needle rather than a hexagonal
  plate, and its panels are subjectively selected representatives.
