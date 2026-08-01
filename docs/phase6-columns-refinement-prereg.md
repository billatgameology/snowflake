# Phase 6 — the columns diagnostic, pre-registered before it ran

**Status:** completed diagnostic; **registered outcome 4 (non-monotone)**. Written and committed
BEFORE any refinement run was launched, so that what each outcome means was fixed before any of
them was observed.

> ## Result correction — 2026-08-01 external review
>
> P1 measured `AR` **1.40000 → 1.52632 → 1.52174** at extents 21, 29 and 35, followed by
> **1.64000** at extent 41. That is non-monotone. Outcome 1 below requires AR to rise monotonically;
> the crossing at the favorable second rung does not satisfy it. The registered reading is therefore
> **outcome 4**, which says to report every rung and forbids selecting the one that helps.
>
> The M1/CAK measurement at extent 29 remains a real controlled diagnostic at matched execution
> conditions: 1.52632 (`column`) versus 0.851852 (`neutral`) at the sampled −5 °C, f = 0.10
> condition. It is **not a matched dip ablation**: the parameter-set change also changes broad
> `sigma_0` functions and facet prefactors. As this pre-registration says in “What this cannot show,”
> it is not hash-gated or admissible as Phase 6 gate evidence. It cannot support a causal SDAK or
> literature-priority claim, establish the whole `columns` regime, or select the production size.
>
> Numerical validity is also mixed rather than “converged”: N = 64 versus N = 80 gives identical AR
> and class at extents 29, 35 and 41, while the registered attached-count domain criterion passes at
> 29 (0.354%), fails at 35 (1.071%), and passes at 41 (0.444%). Both facts travel with the diagnostic.

**This is diagnostic evidence, not Phase 6 gate evidence, and it changes no published number.** Arm 1's 3/90 and arm 2's 54/90 were
measured at the registered size on the registered grid and stand exactly as published whatever this
finds. What is at stake here is an *interpretation* I have been stating: that neither arm produces a
column in the Nakaya `columns` regime. This asks whether that is a property of the model or of the
ruler.

## The measured fact that motivates it

Across the Nakaya `columns` regime (−9.9 < T ≤ −3.3 °C), 36 points per arm, neither arm produced a
single column. The closest approach is arm 2 at **T = −5 °C, f = 0.10: AR = 1.4000**, against a
column floor of 1.5.

In this executed extent-21 corpus, that sampled gap is one observed metric step, not a physical
distance:

- `AR = zExtent / tExtent`, where `zExtent` is an integer layer count and `tExtent` is a lattice
  extent in Cartesian coordinates. AR is therefore **discrete**.
- **408 measurements across both arms produced 36 distinct AR values.** Near the threshold the
  realized ladder is `… 1.3125, 1.4000, 1.5000, 1.6154 …` — step sizes of 0.0875 and 0.1000.
- **No measurement in either arm lands strictly between 1.4 and 1.5.** At this specific
  `zExtent = 21`, the best
  point sits at `tExtent = 15`; qualifying as a column requires `tExtent = 14`. **One lattice cell.**
- The registered `extentFragile` rule (band 0.135 AR, ADR 0025) already flags this point. The
  protocol's own fragility test was pointing at this before I connected it to the columns claim.

So "1.4000 against a floor of 1.5" spans one observed step in these 408 extent-21 rows. It does not
establish a universal lattice or instrument resolution. A sampled verdict that turns on one cell of
transverse extent motivated the physical-size diagnostic; it did not license selecting a larger size.

## Design

Vary the RULER, hold the PHYSICS fixed. Unchanged from the sweep: `dxUm = 0.35`, `cfl = 0.1`,
`surfacePolicy = aggregate-hv-g1h1-v6`, `farField = monopole-matched`, `seedRadius = 2`,
`rngSeed = 1`, `noiseEpsilon = 0`, and each point's own `paramSet` and `sigmaInf`. Changed: `--dims`
and `--target-extent` only.

The measurement-size ladder holds `targetExtent / N = 0.4375` at every rung, the sweep's own ratio,
so the domain-contact margin and the far-field treatment stay comparable rather than improving
alongside the size:

| rung | dims | target extent | note |
|---|---|---|---|
| A | 48,48,48 | 21 | the registered size — reproduces a published row |
| B | 64,64,64 | 28 | |
| C | 80,80,80 | 35 | |

Because `dxUm` is held fixed, a larger target extent is a physically LARGER crystal, not a
finer-resolved one. This ladder therefore measures **habit dependence on physical crystal size** at
four selected conditions; it is not numerical convergence, and a larger crystal is not inherently
better founded. A resolution ladder (smaller `dxUm` at fixed physical size) was not run in this
diagnostic. The historical estimate was roughly 60× more work per point when halving `dxUm`; the
science-first completion plan now requires a separately frozen fixed-physics grid study.

Four points, chosen before running on the single stated criterion "highest AR in the columns regime,
plus one cross-arm control":

| id | arm | T (°C) | f | σ∞ | AR at extent 21 |
|---|---|---|---|---|---|
| P1 | arm 2 (`M1`, dipped parameterization) | −5 | 0.10 | 0.005000 | **1.4000** |
| P2 | arm 2 (`M1`, dipped parameterization) | −4 | 0.10 | 0.004000 | 1.2353 |
| P3 | arm 2 (`M1`, dipped parameterization) | −5 | 0.90 | 0.045000 | 1.2659 |
| P4 | arm 1 (`CAK`, broad-facet parameterization) | −5 | 0.90 | 0.045000 | 1.3125 |

P3 and P4 use the same (T, σ∞) under the two parameter sets, so they control execution conditions
while measuring the **bundled CAK→M1 parameterization change**. They do not isolate the dip factors:
the broad `sigma_0` functions and facet prefactors also change. P1 and P3 sit at opposite ends of the
σ axis, because arm 2's best columns-regime point is at the LOWEST fraction while arm 1's is at the
highest — a difference worth not averaging away.

Rung A is run for all four even though it is already published. If it does not reproduce the
published AR bit-for-bit, the ladder is void and that is the finding.

## What each outcome means, fixed in advance

1. **AR rises monotonically and reaches ≥ 1.5 by rung B or C.** The columns verdict at extent 21 is a
   MEASUREMENT-SIZE artifact. I withdraw the interpretation "neither arm produces a column in the
   columns regime" and replace it with "neither arm produces a column *at the registered measurement
   size*". The published tallies do not move. This is the outcome that would make the ruler, not the
   model, responsible — and WP3 already measured one condition classifying `plate` at extent 9 and
   `neutral` at extent 21, so it is a live possibility rather than a courtesy.
2. **Historical outcome definition: AR flat across the ladder** — every rung within one
   representable step of rung A. The later amendment below established that the required step is
   not defined at the new sizes, so this outcome cannot support a size-convergence conclusion.
3. **AR falls with size.** The extent-21 measurement was optimistic and the failure is worse than
   published. Reported as such.
4. **Non-monotone.** Reported as non-monotone, with every rung shown. I do not get to pick the rung
   that helps.

Outcome 1 is the one that would be convenient for me — it removes a failure. It is written first
here deliberately, and the commitment is that P4 (`CAK`) is reported on the same footing: if it also
crosses 1.5 at rung C, then the sampled size response is not unique to M1, which is less favorable
to an interpretation based on M1's dip factors.

## AMENDMENT 2026-07-31 (second) — THE LADDER'S DOMAIN JUSTIFICATION WAS THE ONE THE PROTOCOL DISPROVES

This document's Design section says the rungs hold `targetExtent / N = 0.4375`, "the sweep's own
ratio, so the domain-contact margin and the far-field treatment stay comparable rather than
improving alongside the size." **That reasoning is refuted by a registered freeze row I did not read
before writing it.** The `domain-budgets` row states:

> "WP3 §1.3 also disproved ADR 0024's ratio-based validity limit, so this number may not be
> extrapolated to any other configuration — it must be re-measured if Δx, **the measurement
> extent**, or the far field changes."

The ladder changes the measurement extent at every rung. Holding a ratio fixed is exactly the
ratio-based extrapolation that row forbids, so **rungs B and C carry no domain-adequacy evidence at
their own measurement sizes**, and the AR rise they report could be a domain effect rather than the
size effect the ladder was built to measure.

**This is a defect in the diagnostic's design, found by me, after the diagnostic returned the result
I then published a correction on.** It is not fatal and it is not hidden: it is testable, and it is
being tested rather than argued.

**Rung B80** — the same target extent 28 as rung B, at N = 80 instead of 64, on P1, the point the
whole correction rests on. The criterion is the registered one (`PHASE6_DOMAIN_SPOT_CHECK`):

- **Historical decision rule, superseded by the multi-extent result:** identical habit class and
  attached counts within 0.5% at extent 28 would have been called adequate locally. That pair did
  pass, but extent 35 later failed the same criterion. One passing pair does not establish N = 64
  adequate or isolate physical size as the cause.
- **Actual status:** class/AR match at all sampled domain pairs, attached-count adequacy is mixed,
  and no tested configuration is demonstrated converged.

Fixed before the run returned, as with everything else here.

## AMENDMENT 2026-07-31 — a latent defect in outcome 2, found while the ladder was still running

**Recorded before the deciding rungs landed**, with P1-B, P2-B and all of rung C still executing.

Outcome 2 is stated as "every rung within one representable step of rung A". Building the reader
(`app/scripts/phase6-ladder-read.mjs`) exposed that **"one representable step" is not computable at
the new measurement sizes**, so as written outcome 2 cannot be evaluated there.

The lattice permits `tExtent ∈ {1 + n/2} ∪ {1 + m·√3/2}`, and those two families interleave
arbitrarily closely — 26·√3/2 = 22.516 sits 0.016 from 22.5 — so the permitted set is nearly dense
and its local gap is not a resolution scale at all. The first version of the reader computed exactly
that and printed `step 0.0000`.

What a grown crystal realizes is far coarser, because D6h symmetry couples Δx and Δy rather than
letting them range independently: **408 crystals produced 36 distinct AR values.** The realized step
is therefore an *empirical* quantity, established only where many crystals were measured — 408 of
them at extent 21, a handful at the ladder's new sizes.

**Consequence, and it is a narrowing rather than a repair.**

- Outcomes **1** (a rung reaches AR ≥ 1.5), **3** (AR falls) and **4** (non-monotone) are
  directional or absolute. They are unaffected and are evaluated as registered.
- Outcome **2** is reported against the extent-21 realized step (0.0875–0.1000 near the floor) as
  the only *measured* scale available, and every such statement is flagged as resting on a threshold
  imported from a different measurement size. **"Size-converged" is the stronger claim, so it does
  not get the benefit of an invented threshold.**

This is a defect in the registration, not in the data, and it is recorded here rather than fixed by
quietly restating outcome 2 in terms the data happens to satisfy.

## What this cannot show

- Nothing about `dxUm` convergence. It was not run here and is not claimed; the active science-first
  plan requires a fixed-physics grid campaign.
- Nothing about the other 32 grid points in the regime. Four points cannot establish that a regime
  is or is not columnar; they can only show whether the best candidate's verdict depends on the
  ruler.
- Nothing registered. No hash gates this, no freeze covers it, and it is not admissible as gate
  evidence — the same rule that bars calibration probes.
