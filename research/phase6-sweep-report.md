# Phase 6 — the no-SDAK validation sweep (arm 1 of 2)

> **ARM 2 HAS RUN. Read [phase6-two-arm-report.md](phase6-two-arm-report.md) instead, or first.**
> This document is arm 1 alone and was written when arm 2 was still hypothetical; its "the Phase 6
> conclusion is deliberately not drawn here" is now discharged there. Everything measured below
> stands unchanged — 3/90, the per-regime table, the class totals, the artifact hashes. What
> changed is that the comparison it was waiting for exists: **SDAK is a trade** (it buys 66
> neutral→plate conversions and pays 20 of this arm's 30 columns), **neither arm produces a single
> column in the Nakaya `columns` regime**, and the AR resolution near the class thresholds has now
> been measured (36 distinct values in 408 measurements), which changes how the near-threshold
> statements in §"What this does NOT establish" should be read.

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
>   `docs/plans/phase-6-nakaya-validation.md:914-916` already recorded this while lines 495-497
>   claimed the opposite — a self-contradiction that predates this work.
>
> **What survives.** Along this sweep's own constant-`f` ladders the αHK reversal count is 1 at
> f = 0.10 and 0 at every larger `f`, never 3 — so the model as run still produces at most one
> transition, and *this parameterization does not reproduce the Nakaya diagram* stands. The claim
> that **no** broad-facet parameterization *could* does not.
>
> Other surviving audit findings against this document: §"What this is a test OF"'s −5 °C reframing
> is cherry-picked (3 of 6 points in this sweep's own −5 °C row exceed ρ > 1 and none is a plate);
> the claim that `CAK` and `CAK_A1` are "the same model" in `plates-cold` is falsified by the two
> `points.json` files; and Finding 5's σ-contrast figures are `CAK_A1` values.

The registered 204-point sweep, run to completion against the frozen protocol under the registered
parameter set `CAK`.

**Status: this is one arm of a two-arm comparison, and the Phase 6 conclusion is deliberately not
drawn here.** On maker direction (2026-07-28) Phase 6 reports the no-SDAK arm and the SDAK arm
together, no-SDAK as the control and SDAK as the treatment, rather than publishing this arm alone.
The numbers below are complete and final for this arm; what they *mean* for the phase waits.

**These numbers are not yet gate evidence.** WP5 has not run: no independent verifier has
re-derived `report.json` from `points.json`, and the six negative controls have not executed. Until
then this is a measured result with verified provenance, which is not the same thing.

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

Artifacts live in the ignored evidence tree `out/phase6-sweep/`; their hashes are the tracked
record, as for research media under decision 0004. The preflight refused to produce any of it until
the freeze was complete, the manifest hashed to the registered pin, the freeze commit was an
ancestor of HEAD, and the tracked tree was clean.

### What this replaces, and why

An earlier 204-point sweep at commit `6995868` (protocol `9aa2e7c1…`) scored **5/90** and is
**invalidated by ADR 0031**, not merely superseded. It ran `CAK_A1`, in which `A_prism ≡ 1`, while
`PHASE6_INTERPOLATION` registered `aPrism: "piecewise-linear-in-(Tm-T)"` — distinct from
`aBasal: "constant-1"`. The runs violated a registered freeze row, because the harness emitted no
`--param-set` and the CLI default supplied `CAK_A1`. Its artifacts are preserved unmodified at
`out/phase6-sweep-6995868-cak-a1-superseded/`.

**A verification hazard found while this sweep ran, and recorded because it is not yet fixed.** The
harness captures provenance once at preflight, but each of the 204 children spawns
`runner/src/main.ts` from the **working tree**. An edit to `runner/src/` or `core/src/` mid-run
would change the physics for later points while the report still named the launch commit. Nine
commits from a parallel session landed during this run; `git diff 390fe35..HEAD -- runner/src
core/src` was verified **empty**, so this sweep is unaffected. That was luck, not design. The fix —
preflight asserting the child command line carries every frozen parameter, plus a completion-time
re-check — is outstanding.

## What this is a test OF

**A no-SDAK model failing to reproduce the Nakaya diagram is Libbrecht's own published
expectation, not a discovery of this project.** He states it directly (arXiv:2306.13087 p5):

> "the SDAK phenomenon provides the only viable option currently available that can adequately
> explain the Nakaya diagram together with a plethora of other ice-growth data."

Phase 6 is the first *independent test* of that claim with a 3-D solver, never its discovery.
Every sentence below is scoped accordingly.

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
regime is reported but kept out of the headline because it accepts both pure classes.

> ### **Headline: 3 of 90 headline-scope points agree.**

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

**1. One transition, never three.** Wherever habit appears at all, the sequence is
plate → neutral → column, monotone in temperature, with no return. The reference has three
boundaries. This is the structural claim the pre-registration made — one monotone σ₀ crossing
cannot produce three transitions — and it is measured, not argued. It now holds under **both**
parameter sets, which is stronger than holding under one: `research/libbrecht-figure-findings.md`
§1 computes that *every* printed broad-facet parameterization has exactly one crossing (ours at
−10.00 °C, `2306.13087v1` M2 at −8.39, `2009.08404v2` Eq. 3 at −10.92), while M1 with both SDAK
dips has ~~five~~ **three, at 3.08 / 8.07 / 24.73** (`log` is base-10 — see the retraction above).

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

**5. Rising supersaturation destroys habit outright, and more completely than before.** Columns
occur only at f = 0.10 and 0.15. **At f = 0.40, 0.60 and 0.90 the model produces nothing but
neutral across all 34 temperatures** — under `CAK_A1` that was true only at f = 0.90. This was
predicted pre-sweep from the α ratio (`alphaHK = A·exp(−σ₀/σ_surf)` saturates toward `A`,
compressing basal/prism contrast), but the measured effect is total rather than a bias. The
reference diagram is at its most structured exactly there — dendrites, sectored plates, needles.

## What this does NOT establish

- **It is not a test of SDAK.** Every run is no-SDAK; `SDAK` appears in no source file. Under ADR
  0005 a SDAK model reproducing this diagram would be an in-sample result anyway, because the dip
  locations were chosen against it. That is why arm 2 needs its own pre-registration.
- **Producing columns needs three things this arm has none of**, per
  `research/libbrecht-figure-findings.md` §10.2: a width-dependent nucleation barrier whose
  controlling terrace width is **~50 nm against this grid's 350 nm cells**; a fast-growth transient,
  since at −5 °C "both platelike and needlelike crystals can grow under essentially identical
  conditions" — so **habit is not single-valued in (T, σ) there** and no deterministic per-point
  score can be right in that band even in principle; and a background gas, which at 1 atm is the
  one requirement already met.
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
  direction at both*, while the two bands demand opposite moves, so no temperature-independent seed
  can agree at both. None of the five agreed at either condition.
- **Habit is measured at extent 21, and habit is size-dependent.** 16 points sit within the
  registered ±0.135 extent-drift bound of a class threshold and are flagged extent-fragile.
- **No cross-platform control has been run.** Scoped to the registered x64 host until the arm64
  fixture runs — four tier-2 points plus the tier-1 fingerprint, per
  `docs/phase6-cross-platform-control.md`. **MAC RUN NEEDED.**
- **The comparison target is a redrawn 1954 schematic** whose supersaturation axis WP1 measured as
  failing an independent check, which is why only its three boundary temperatures are used.
- **The 206-observation alternative cannot substitute for it in the bands that matter.** With the
  supersaturation convention now settled as ice-relative (verified in arXiv:1211.5555 p2 and the
  monograph p59), that data set's rows are 7–150 % while this sweep's executed σ∞ spans
  0.20–36.63 %. There is **no overlap at all warmer than −8 °C** — the whole `plates-warm` regime
  and most of `columns`. It also seeds every crystal on a c-axis needle rather than a hexagonal
  plate, and its panels are subjectively selected representatives.
