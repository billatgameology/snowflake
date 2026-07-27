# Phase 6 numerical verification — the four convergence studies

Charter §3.2 Phase 6 item 2 requires numerical verification, and requires it *reported*. This is
that report. It is the WP3 deliverable and it runs **before** the grid freeze, because
calibration had already shown a small domain producing a different growth regime rather than a
coarser version of the same one.

Every run below: surface policy `aggregate-hv-g1h1-v6` (ADR 0023), far field `monopole-matched`
(ADR 0024), noise off, seed radius 2, `paramSet` CAK_A1, `relaxTol` 1e-9, `divTol` 1e-7.
**Every point reported `symErr = 0`, `deltaSymClean = true`, and every relaxation converged** —
so nothing here rests on a run whose symmetry or convergence was in doubt.

Two temperatures at the same water-relative fraction **f = 0.15**, which the pre-registration
established as the discriminating fraction: it maximises the basal/prism contrast at both ends
(α ratio 0.56 warm, 1.40 cold) where f = 0.90 collapses it toward 1 and σ∞ = 0.002 puts the cold
side in a dead-facet regime. Warm is −5 °C, σ∞ = 0.0075; cold is −15 °C, σ∞ = 0.02355.

Wall times are **not** reported as costs: the campaign ran up to thirteen jobs concurrently on
eight physical cores, so every second is contended by construction.

---

## The one result that matters most

**All four axes show the same split: the habit CLASS converges early, the value underneath
converges late or not at all.**

| axis | class converged at | value converged at |
|---|---|---|
| domain N | 40 | not converged by 64 |
| timestep `cflFill` | every value tested (8× range) | 0.05 |
| measurement extent | 9 warm / 31 cold | 9 warm / 31 cold |
| grid Δx | 0.35 (0.7 flips it) | **not converged at 0.2333** |

This is what the sweep may and may not claim. Habit classifications are robust and the sweep is
viable on them. Any statement about *how far* a point sits from a classification threshold
inherits an unconverged systematic and must carry it.

---

## 1. Domain (far-field independence)

Fixed Δx = 0.35 µm, measured at extent 15.

| N | warm attached / AR | cold attached / AR |
|---|---|---|
| 28 | 521 / 0.3810 plate | 1409 / 0.8381 neutral |
| 32 | 521 / 0.3810 plate | 1409 / 0.8381 neutral |
| 40 | 521 / 0.3810 plate | 1481 / 0.9905 neutral |
| 48 | 521 / 0.3810 plate | 1505 / 0.9905 neutral |
| 64 | 521 / 0.3810 plate | 1553 / 0.9905 neutral |

Aspect ratio is converged from N = 28 warm and N = 40 cold. Attached count is **not** converged
even at 64³ on the cold side — it climbs 1481 → 1505 → 1553 while `AR` sits fixed at 0.9905, so
the crystal fills the same bounding box more densely in a larger domain. That is a real domain
effect the registered criterion cannot see, and it is reported as a systematic rather than
called converged.

**Minimum domain for habit classification: N = 40.**

Note this is *with* the monopole-matched shell. Under fixed-σ Dirichlet the same comparison
swings 4.1% in attached count from domain size alone (ADR 0024), which is why the far field was
changed before this study rather than after it.

## 2. Timestep (fill-CFL)

Fixed 48³, Δx = 0.35 µm, extent 15.

| `cflFill` | warm steps / attached / AR | cold steps / attached / AR |
|---|---|---|
| 0.2 | 44 / 539 / 0.3810 | 91 / 1697 / 0.9905 |
| 0.1 | 87 / 521 / 0.3810 | 176 / 1505 / 0.9905 |
| 0.05 | 168 / 527 / 0.3810 | 342 / 1649 / 0.9905 |
| 0.025 | 333 / 521 / 0.3810 | 677 / 1649 / 0.9905 |

`AR` is identical at every timestep at both temperatures — an 8× change in step size does not
move the registered criterion at all. Attached count is not converged until `cflFill ≤ 0.05`:
cold runs 1697 → 1505 → 1649 → 1649, non-monotone, settling on 1649, so **cfl = 0.1 is 8.7% off
the converged volume while classifying identically**. Warm spreads ~1%.

**`cflFill` = 0.1 is adequate for a habit-class sweep and is not adequate for a reported
volume.** Whichever is registered, the other is labelled not-converged at that setting.

## 3. Measurement extent (habit development)

Fixed 64³, Δx = 0.35 µm, grown to extent 39 with metrics every 5 steps, so each run yields the
whole curve rather than an endpoint.

| extent | 9 | 13 | 17 | 21 | 25 | 29 | 33 | 37 | 39 |
|---|---|---|---|---|---|---|---|---|---|
| **warm** | 0.378 | 0.439 | 0.337 | 0.382 | 0.413 | 0.423 | 0.419 | 0.371 | **0.405** |
| **cold** | 0.631 | 0.750 | 0.938 | 1.105 | 1.190 | 1.160 | 1.222 | 1.276 | **1.258** |

**Warm is flat from extent 9**, oscillating in a band ≈ 0.31–0.45 about a mean near 0.40. The
oscillation is lattice discreteness — `AR` is a ratio of integer-ish extents — and it never
approaches the 0.667 plate ceiling, so the class is never in doubt.

**Cold develops slowly and converges only near extent 31**, rising 0.63 → 1.25 and flattening in
the 1.20–1.28 band from extent 31 onward.

**Measurement size must be set by the slowest-developing habit.** A size adequate for the warm
plate (extent 9) would read cold at ≈ 0.63 and classify it **plate** — the opposite of its
converged neutral, and a silent misclassification of half the diagram.

**The class/value split applies here too, and the distinction is what makes the sweep
affordable.** Cold's *classification* settles at extent 11 and carries comfortable margin by
15–19 (`AR` 0.99–1.06 against a 0.667 plate ceiling); its *value* settles only near 31.

| cold extent | 9 | 11 | 15 | 19 | 31 | 39 |
|---|---|---|---|---|---|---|
| `AR` | 0.631 | 0.700 | 0.991 | 1.056 | 1.240 | 1.258 |
| class | plate | neutral | neutral | neutral | neutral | neutral |

Since the registered criterion is the class, **extent ≈ 21 is the defensible measurement size**
and extent 31 is what a converged *value* would require. That difference is not a nicety: it
interacts with the ADR 0024 monopole validity limit, which needs `rho_far` comfortably larger
than the crystal. At extent 31 the ratio is 2.06 at 64³ and 1.55 at 48³ — inside the regime
where the measured breakdown occurred — so a value-converged measurement would force N ≈ 96 and
make the sweep unaffordable. At extent 21 the ratio at 64³ is 3.05, safely outside it.

**Registered minimum measurement extent: 21, for classification.** Any quantitative `AR` quoted
at that size carries the residual extent drift toward the extent-31 value, on top of the grid
systematic below.

> **Sequencing note, recorded because it was an error.** The domain ladder in §1 was run at
> extent 15 and the measurement extent was then chosen from these curves, so the two do not
> compose: domain independence was never demonstrated at the size actually registered. A domain
> ladder at extent 21 across N = 40…80 closes that gap and is what fixes the registered domain
> budget; §1's N = 40 is a lower bound established at a smaller crystal, not the answer.

## 4. Grid spacing — the axis that does not converge

Fixed physical box 16.8 µm and fixed physical measurement size; N and target extent scale with
Δx so the physics compared is identical.

| Δx (µm) | N | extent | warm attached / AR | cold attached / AR |
|---|---|---|---|---|
| 0.700 | 24 | 9 | 67 / 0.3784 plate | 141 / **0.6307 plate** |
| 0.350 | 48 | 15 | 521 / 0.3810 plate | 1505 / **0.9905 neutral** |
| 0.2333 | 72 | 23 | 2325 / 0.4488 plate | 6951 / **1.0952 neutral** |

**Δx = 0.7 changes the habit class.** Cold reads plate there and neutral at both finer spacings.
A coarse grid is therefore not a cheaper version of the answer; it is a different one.

**Δx = 0.35 — the value every result in this project has used — is not converged either.** `AR`
still moves +10.6% cold and +18% warm going finer, and moves *toward* column. Successive changes
fall by a factor 0.291 against the 0.333 expected for first order, so the convergence is
approximately first order and extrapolates to

> **h → 0: warm `AR` ≈ 0.584, cold `AR` ≈ 1.305** (extrapolated from three points assuming
> first order — not a measurement).

Both then sit substantially closer to their thresholds than the Δx = 0.35 numbers suggest — warm
0.584 against a plate ceiling of 0.667, cold 1.305 against a column floor of 1.5. Neither class
flips under the extrapolation, but the margins are thin and **both move in the direction that
would flip them**.

### What this does to the cold reading

Extent and grid push cold the same way. Extent-converged at Δx = 0.35 the cold value is 1.258;
the grid extrapolation measured at extent 23 was worth about +0.21. Naively combining them puts
a fully converged cold `AR` near **1.47, essentially on the 1.5 column boundary**.

That combination is an extrapolation of an extrapolation and is **not** a result. It is recorded
because it identifies the single most consequential open measurement in Phase 6: whether the
cold condition is neutral or column is not robustly decided by the physics at f = 0.15 — it is
decided by grid convergence and by where the threshold sits. Settling it needs a converged-grid
run at extent ≥ 31, which at Δx = 0.2333 costs hours per point.

**Either way the disagreement with Nakaya survives**, which is why this does not change the
registered expectation: if cold is neutral, the model produces no reversal at f = 0.15; if cold
is column, it produces a reversal in the **opposite sense** to the diagram, whose −9.9 °C
boundary separates columns on the warm side from plates on the cold side. The model's single
σ₀ crossing at −10 °C runs plate-warm → column-cold.

---

## Validity, and what is not established here

- **The ρ_far equivariance fix is verified inert on 18 points**, bit-identical across the domain
  ladder (10) and the timestep ladder (8, but for the one broken flag it corrected). The grid
  ladder's six points all reported clean deltas and stand on that verified argument.
- **No cross-platform control has been run.** `Math.exp`/`log`/`pow` are not specified to be
  correctly rounded, so nothing here claims bitwise reproducibility off this host. The arm64
  control remains outstanding and every claim above is scoped to the registered x64 host.
- **These are coordinator-run studies, not gate evidence.** Their conclusions feed WP0c's
  freeze; their printed metrics are not citable as a Phase 6 result.
- Wall times are contended and are not cost measurements.
