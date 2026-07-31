# Phase 6 — the columns diagnostic, pre-registered before it ran

**Status:** pre-registration. Written and committed BEFORE any refinement run was launched, so that
what each outcome means was fixed before any of them was observed.

**This is not evidence and it changes no published number.** Arm 1's 3/90 and arm 2's 54/90 were
measured at the registered size on the registered grid and stand exactly as published whatever this
finds. What is at stake here is an *interpretation* I have been stating: that neither arm produces a
column in the Nakaya `columns` regime. This asks whether that is a property of the model or of the
ruler.

## The measured fact that motivates it

Across the Nakaya `columns` regime (−9.9 < T ≤ −3.3 °C), 36 points per arm, neither arm produced a
single column. The closest approach is arm 2 at **T = −5 °C, f = 0.10: AR = 1.4000**, against a
column floor of 1.5.

That gap is one step of the instrument, not a physical distance:

- `AR = zExtent / tExtent`, where `zExtent` is an integer layer count and `tExtent` is a lattice
  extent in Cartesian coordinates. AR is therefore **discrete**.
- **408 measurements across both arms produced 36 distinct AR values.** Near the threshold the
  realized ladder is `… 1.3125, 1.4000, 1.5000, 1.6154 …` — step sizes of 0.0875 and 0.1000.
- **No measurement in either arm lands strictly between 1.4 and 1.5.** At `zExtent = 21` the best
  point sits at `tExtent = 15`; qualifying as a column requires `tExtent = 14`. **One lattice cell.**
- The registered `extentFragile` rule (band 0.135 AR, ADR 0025) already flags this point. The
  protocol's own fragility test was pointing at this before I connected it to the columns claim.

So "1.4000 against a floor of 1.5" is one representable step, and the registered protocol already
says so. A verdict that turns on one cell of transverse extent is not yet a statement about physics.

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
finer-resolved one. This ladder therefore tests **size convergence of the habit**, which is the
question the data actually raises. A resolution ladder (smaller `dxUm` at fixed physical size) is the
other half and is NOT run here: halving `dxUm` multiplies cost by roughly 60× per point, which is
not affordable, and saying so is better than running a version too small to mean anything.

Four points, chosen before running on the single stated criterion "highest AR in the columns regime,
plus one cross-arm control":

| id | arm | T (°C) | f | σ∞ | AR at extent 21 |
|---|---|---|---|---|---|
| P1 | arm 2 (M1, SDAK) | −5 | 0.10 | 0.005000 | **1.4000** |
| P2 | arm 2 (M1, SDAK) | −4 | 0.10 | 0.004000 | 1.2353 |
| P3 | arm 2 (M1, SDAK) | −5 | 0.90 | 0.045000 | 1.2659 |
| P4 | arm 1 (CAK, no SDAK) | −5 | 0.90 | 0.045000 | 1.3125 |

P3 and P4 are the same (T, σ∞) under the two parameter sets, so the pair isolates SDAK at fixed
conditions. P1 and P3 sit at opposite ends of the σ axis, because arm 2's best columns-regime point
is at the LOWEST fraction while arm 1's is at the highest — a difference worth not averaging away.

Rung A is run for all four even though it is already published. If it does not reproduce the
published AR bit-for-bit, the ladder is void and that is the finding.

## What each outcome means, fixed in advance

1. **AR rises monotonically and reaches ≥ 1.5 by rung B or C.** The columns verdict at extent 21 is a
   MEASUREMENT-SIZE artifact. I withdraw the interpretation "neither arm produces a column in the
   columns regime" and replace it with "neither arm produces a column *at the registered measurement
   size*". The published tallies do not move. This is the outcome that would make the ruler, not the
   model, responsible — and WP3 already measured one condition classifying `plate` at extent 9 and
   `neutral` at extent 21, so it is a live possibility rather than a courtesy.
2. **AR flat across the ladder** — every rung within one representable step of rung A. The habit is
   size-converged at the registered size and the columns failure is a property of the model at these
   settings. This is the outcome that converts a limitation into a result.
3. **AR falls with size.** The extent-21 measurement was optimistic and the failure is worse than
   published. Reported as such.
4. **Non-monotone.** Reported as non-monotone, with every rung shown. I do not get to pick the rung
   that helps.

Outcome 1 is the one that would be convenient for me — it removes a failure. It is written first
here deliberately, and the commitment is that P4 (arm 1, no SDAK) is reported on the same footing:
if arm 1 also crosses 1.5 at rung C, then size, not SDAK, is what makes columns, and that is a worse
result for the SDAK arm than the one I am currently reporting.

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

- Nothing about `dxUm` convergence. Not run, not affordable, not claimed.
- Nothing about the other 32 grid points in the regime. Four points cannot establish that a regime
  is or is not columnar; they can only show whether the best candidate's verdict depends on the
  ruler.
- Nothing registered. No hash gates this, no freeze covers it, and it is not admissible as gate
  evidence — the same rule that bars calibration probes.
