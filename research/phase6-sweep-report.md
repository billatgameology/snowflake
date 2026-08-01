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

> ## ⚠ RETRACTION — Finding 1's structural bound is WRONG (2026-07-29)
>
> **Finding 1 below, and the crossing counts it cites, are retracted.** An adversarial audit refuted
> them and I reproduced the refutation independently. The measured results in this report — the
> 3/90 headline, the per-regime table, the class totals, the diagram, the artifact hashes — are
> **unaffected**. What is retracted is the *interpretation*.
>
> - The bound was computed on **σ₀** crossings. Habit depends on the ordering of
>   `alphaHK = A·exp(−σ₀/σ_surf)`, which carries `A_prism`. With `A_prism` included, the printed
>   broad-facet set has **three** αHK crossings (σ_surf ≈ 0.199–0.399 %) and the registered `CAK`
>   set has three for σ_surf ∈ [0.00247, 0.00366] — a band containing **2 of these 204 points**.
> - The count depends on σ_surf, so it is **not** "independent of diffusion, grid, seed, far field".
> - The M1 count of five crossings is wrong: `log` in the printed dip formulas is base-10, giving
>   **three** at 3.08 / 8.07 / 24.73.
> - Three σ₀ crossings are also reachable **inside** the registered ±25 % per-anchor digitization
>   band (6561 of 19683 corner combinations), so "the count is invariant under the band" is false.
>   the historical Phase 6 plan's structural-bound section already recorded this while another
>   section claimed the opposite — a self-contradiction preserved and superseded in that plan.
>
> **What survives.** Along this sweep's sampled constant-`f` ladders the `alphaHK` reversal count is
> 1 at f = 0.10 and 0 at every larger sampled `f`. Separately, the historical pure-class habit
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

| regime | headline | n | in headline | agree (headline) | neutral |
|---|---|---|---|---|---|
| `plates-warm` (T > −3.3) | yes | 12 | 6 | **3** | 7 |
| `columns` (−3.3…−9.9) | yes | 36 | 24 | **0** | 35 |
| `plates-cold` (−9.9…−21.5) | yes | 72 | 60 | **0** | 69 |
| `columns-and-plates` (< −21.5) | no | 84 | 0 | 27 (reported) | 57 |

Class totals over all 204 points: **6 plate, 168 neutral, 30 column, 0 invalid.**
16 points are flagged extent-fragile.

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

**2. Zero invalid runs in 204, in both sweeps.** Every point converged under the dual criterion,
held `symErr = 0` with noise off, kept every per-tick attachment delta D6h-invariant, and cleared
the 65% domain-contact guard. Nothing was excluded, so nothing had to be argued about.

**3. The σ₀ crossing marks where plate STOPS, not where column STARTS.** Plate now ends at −4 °C
(f = 0.10), −3 °C (f = 0.15) and −2 °C (f = 0.25); column does not begin until −19 °C (f = 0.10) or
−23 °C (f = 0.15). The neutral band between them is 14–19 °C wide and is the single largest feature
of the measured diagram. **Crossing location and habit-transition location are different
observables**, and only the second is what a morphology diagram records. Libbrecht states the
requirement as `α_prism ≪ α_basal` — with the ≪ — for columns (`2306.13087v1` p4), which is the
same point from the source side.

**4. Correcting A_prism shrank the plate region and widened the neutral band.** Under `CAK_A1`
plate held to −8/−9 °C across f = 0.10–0.40; under `CAK` it reaches only −4/−3/−2 °C and vanishes
entirely at f ≥ 0.40. The cold end is unchanged — column onset stays at −19/−23 °C — exactly as
expected, since `2009.08404v2` Fig. 2's caption states `A_basal ≈ A_prism ≈ 1` between −10 and
−30 °C, so the two parameter sets ~~are the same model there~~ **nearly coincide from about −15 °C
colder**. Measured: 11 of the 72 points in −10…−21 °C differ, max |ΔAR| = 0.1092, and `A_prism` is
0.830 at −10 °C rising to 1 only at −15 °C. **No `plates-cold` point changed class**, which is what
the 0/60 result rests on.

**5. Higher sampled supersaturation removes pure habit over most of the CAK grid.** Columns
occur only at f = 0.10 and 0.15. **At f = 0.40, 0.60 and 0.90 the model produces nothing but
neutral across all 34 temperatures** — under `CAK_A1` that was true only at f = 0.90. This was
predicted pre-sweep from the α ratio (`alphaHK = A·exp(−σ₀/σ_surf)` saturates toward `A`,
compressing basal/prism contrast), but the measured effect is total rather than a bias. The
reference diagram is at its most structured exactly there — dendrites, sectored plates, needles.

## What this does NOT establish

- **It is not a test of SDAK.** Every run is no-SDAK; `SDAK` appears in no source file. Under ADR
  0005 a SDAK model reproducing this diagram would be an in-sample result anyway, because the dip
  locations were chosen against it. That is why arm 2 needs its own pre-registration.
- **Three source-motivated limitations are absent from this arm**, per
  `research/libbrecht-figure-findings.md` §10.2: a width-dependent nucleation barrier whose
  controlling terrace width is **~50 nm against this grid's 350 nm cells**; a fast-growth transient,
  since at −5 °C "both platelike and needlelike crystals can grow under essentially identical
  conditions", which motivates a population-aware comparison rather than treating one run as the
  whole distribution; and a background gas, which at 1 atm is already represented. This list does
  not prove that every item is necessary or that no deterministic score could fit a more tightly
  controlled experiment.
- **CORRECTED — the earlier claim that our σ₀_prism was "low by 1.6–3.2× at −2…−5 °C" is
  REVERSED.** The dedicated measurement papers give σ₀,prism = 0.03% at −2 °C and ≈0.2% at −5 °C;
  our digitized curve matches to ~7%. The closed form we were judging ourselves against
  (`2306.13087v1` M2) is the outlier at ×3.01. `2009.08404v2` Eq. 3 gives ×1.07, and its Eq. 5
  reproduces our digitized `A_prism` anchors to 8.4% worst. The warm end does **not** rest on a
  suspect σ₀_prism.
- **CORRECTED — seed shape IS class-changing.** The earlier statement that it was "a large
  systematic, though not a class-changing one" was based on two seed thicknesses. A five-seed probe
  found a needle-like seed produces a genuine **column (AR 1.6154) at −15 °C, where the reference
  requires a plate**. Seed geometry moves AR by +0.41 (−5 °C) and +0.51 (−15 °C) — but in the *same
  direction at both*, while the two bands demand opposite moves. None of the five sampled seeds
  agreed at either sampled condition; this does not rule out every temperature-independent seed.
- **Habit is measured at extent 21, and selected points show physical-size dependence.** The
  historical one-sided rule flags 16 points; a closed symmetric distance flags 59 total CAK rows
  (43 additional). The four-point ladder is diagnostic and non-monotone, not a regime-wide size or
  numerical-convergence study.
- **The cross-platform control ran on four CAK configurations only.** Tier 1 differs in 9 of 448
  fingerprint entries, at 1–31 ULP (`2a9f64b3` versus `3662b9e2`); tier 2 reproduced all four output
  rows exactly, including the AR = 1.5000 tie. This establishes neither the other 200 CAK rows nor
  any M1 row. See `docs/phase6-cross-platform-control.md` §Result.
- **The comparison target is a redrawn 1954 schematic** whose supersaturation axis WP1 measured as
  failing an independent check, which is why only its three boundary temperatures are used.
- **The 206-observation alternative cannot substitute for it in the bands that matter.** With the
  supersaturation convention now settled as ice-relative (verified in arXiv:1211.5555 p2 and the
  monograph p59), that data set's rows are 7–150 % while this sweep's executed σ∞ spans
  0.20–36.63 %. There is **no overlap at all warmer than −8 °C** — the whole `plates-warm` regime
  and most of `columns`. It also seeds every crystal on a c-axis needle rather than a hexagonal
  plate, and its panels are subjectively selected representatives.
