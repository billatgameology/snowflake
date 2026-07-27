# Phase 6 numerical verification — the four convergence studies

Charter §3.2 Phase 6 item 2 requires numerical verification, and requires it *reported*. This is
that report. It is the WP3 deliverable and it runs **before** the grid freeze, because
calibration had already shown a small domain producing a different growth regime rather than a
coarser version of the same one.

Every run below: surface policy `aggregate-hv-g1h1-v6` (ADR 0023), far field `monopole-matched`
(ADR 0024), noise off, seed radius 2, `paramSet` CAK_A1, `relaxTol` 1e-9, `divTol` 1e-7.
**Every point reported `symErr = 0`, `deltaSymClean = true`, and every relaxation converged** —
so nothing here rests on a run whose symmetry or convergence was in doubt. The single exception
is the ADR-reproduction table in §1.3, which is run at that ADR's own tolerances and reports no
symmetry metric; it is flagged in place.

Two temperatures at the same water-relative fraction **f = 0.15**, which the pre-registration
established as the discriminating fraction: it maximises the basal/prism contrast at both ends
(α ratio 0.56 warm, 1.40 cold) where f = 0.90 collapses it toward 1 and σ∞ = 0.002 puts the cold
side in a dead-facet regime. Warm is −5 °C, σ∞ = 0.0075; cold is −15 °C, σ∞ = 0.02355.

Wall times are **not** reported as costs: the campaign ran up to thirteen jobs concurrently on
eight physical cores, so every second is contended by construction.

---

## The one result that matters most

**Three of the four axes show the same split: the habit CLASS converges early, the value
underneath converges late or not at all. Domain is the exception — and only once it is measured
at the size actually registered.**

| axis | class converged at | value converged at |
|---|---|---|
| domain N, at extent 21 | 40 | 48 to 0.04%, exact from 64 |
| timestep `cflFill` | every value tested (8× range) | 0.05 |
| measurement extent | 9 warm / 11 cold | 9 warm / 31 cold |
| grid Δx | 0.35 (0.7 flips it) | **not converged at 0.2333** |

This is what the sweep may and may not claim. Habit classifications are robust and the sweep is
viable on them. Any statement about *how far* a point sits from a classification threshold
inherits an unconverged systematic and must carry it.

---

## 1. Domain (far-field independence)

Two ladders were run. **§1.2 is the one that fixes the registered budget**, because it is the
only one measured at the size §3 registers. §1.1 is kept because it is what the measurement
extent was chosen against, and because the difference between the two is itself a result.

### 1.1 At extent 15 — superseded, and wrong about convergence

Fixed Δx = 0.35 µm, measured at extent 15.

| N | warm attached / AR | cold attached / AR |
|---|---|---|
| 28 | 521 / 0.3810 plate | 1409 / 0.8381 neutral |
| 32 | 521 / 0.3810 plate | 1409 / 0.8381 neutral |
| 40 | 521 / 0.3810 plate | 1481 / 0.9905 neutral |
| 48 | 521 / 0.3810 plate | 1505 / 0.9905 neutral |
| 64 | 521 / 0.3810 plate | 1553 / 0.9905 neutral |

Aspect ratio is converged from N = 28 warm and N = 40 cold. Attached count is **not** converged
even at 64³ on the cold side — it climbs 1481 → 1505 → 1553 while `AR` sits fixed at 0.9905.
This was originally reported as a real domain effect that the registered criterion cannot see.
**§1.2 shows that reading was wrong**: the residual is an artefact of stopping at extent 15,
where the cold crystal is still developing steeply (§3: `AR` runs 0.63 → 1.25 over this range),
so a one-step difference in which step trips the size target moves the attached count. At a size
where the habit has developed, the domain dependence is gone.

### 1.2 At the registered measurement size — extent 21

Ten points, Δx = 0.35 µm, `cflFill` = 0.1, measured at extent 21. `minShell` is the distance from
the domain centre to the **nearest** shell cell, in cells, read off the solver's own `rho_far`
array; clearance is that minus the crystal's half-extent of 10.5. Both matter for §1.3.

| N | minShell | clearance | warm step / attached / AR | cold step / attached / AR |
|---|---|---|---|---|
| 40 | 16.46 | 5.96 | 145 / 1513 / 0.3821 plate | 315 / 5185 / 1.1053 neutral |
| 48 | 19.92 | 9.42 | 145 / 1513 / 0.3821 plate | 316 / 5161 / 1.1053 neutral |
| 56 | 23.39 | 12.89 | 145 / 1513 / 0.3821 plate | 320 / 5161 / 1.1053 neutral |
| 64 | 26.85 | 16.35 | 145 / 1513 / 0.3821 plate | 322 / 5159 / 1.1053 neutral |
| 80 | 33.78 | 23.28 | 145 / 1513 / 0.3821 plate | 321 / 5159 / 1.1053 neutral |

**Warm is bit-identical at all five domains** — same step count, same attached count, same `AR`
— across a 8× range in cell count. **Cold's `AR` is identical at all five**, and its attached
count runs 5185 → 5161 → 5161 → 5159 → 5159: converged **exactly** from N = 64, and to within
2 cells (0.04%) from N = 48.

The mechanism is visible in the step counts, which rise 315 → 316 → 320 → 322 as the domain
grows. A larger domain supplies slightly less vapor, so the crystal takes slightly longer to
reach the same size and arrives very slightly less dense. That is the residual over-supply
draining away with distance, exactly as monopole matching predicts, and it has drained to
nothing by N = 64.

**Registered minimum domain: N = 48**, carrying a measured +0.04% attached-count residual
against the N ≥ 64 asymptote. N = 64 is the exact answer and costs roughly 3× more per point
(2.37× the cells, plus relaxation sweeps that themselves scale with N) — which across a sweep of
dozens of points is the difference between affordable and not. Compared like for like against the
other attached-count systematic on the table, §2's registered `cflFill` = 0.1 sits **8.7%** off
its converged volume; the domain residual at N = 48 is 200× smaller than the timestep residual
already being accepted. `AR` is identical at all five domains, so it cannot move a habit class.

**This ladder generalises across habits, by construction.** The stopping criterion is
`largestExtent >= 21`, and `largestExtent = max(tExtent, zExtent)`, so every sweep point is
measured with the crystal bounded inside a 21-cell box in *every* direction regardless of whether
it is a plate, a column or neutral. The shell clearance that governs §1.3 is therefore fixed at
the value tabulated above for the whole sweep, not just for these two conditions.

What it does **not** establish is independence from growth *rate*. Eq. 5.30's correction is
proportional to `dV/dt`, so a much faster-growing condition carries a larger correction and
potentially a larger residual. The cold point here is the faster of the two (5159 cells against
warm's 1513) and is also the slower to converge, which is consistent. The sweep's fastest-growing
point should be spot-checked against N = 64 rather than assumed covered.

Note this is *with* the monopole-matched shell. Under fixed-σ Dirichlet the same comparison
swings 4.1% in attached count from domain size alone (ADR 0024), which is why the far field was
changed before this study rather than after it.

### 1.3 Where the monopole far field actually stops working

ADR 0024 registered a validity limit and attributed it to the point-source approximation needing
`rho_far` large compared with the crystal — a **ratio**. §1.2 contradicts that directly: its
N = 40 warm point sits at ratio 1.57 and is bit-identical to N = 80, while the ADR's breakdown
case sits at a *higher* ratio. So the limit was measured rather than left inferred, by shrinking
the domain at a fixed crystal size until the answer moves. Warm, four points, same tolerances as
§1.2:

| N | minShell | ratio | clearance | step / attached / AR |
|---|---|---|---|---|
| 28 | 11.27 | 1.07 | 0.77 | 143 / **1489** / 0.3821 |
| 32 | 13.00 | 1.24 | 2.50 | 144 / 1513 / 0.3821 |
| 36 | 14.73 | 1.40 | 4.23 | 145 / 1513 / 0.3821 |
| 40 | 16.46 | 1.57 | 5.96 | 145 / 1513 / 0.3821 |

and the ADR's own configuration re-run with the crystal size reported (warm, 30 steps, which
reaches extent 9 in every domain). **This second table is the one exception to the tolerances
declared at the top of this report**: it uses `relaxTol` 1e-8 and `divTol` 1e-6, the values in
`solver-cpu/test/monopole-far-field.test.ts`, deliberately, so that it reproduces the ADR's own
numbers rather than a lookalike. It also reports no symmetry metric, because the probe measured
geometry and attached counts only:

| N | minShell | ratio | clearance | attached |
|---|---|---|---|---|
| 20 | 7.81 | 1.74 | 3.31 | **105** |
| 24 | 9.54 | 2.12 | 5.04 | 81 |
| 28…48 | 11.27…19.92 | 2.50…4.43 | 6.77…15.42 | 81 |

**Neither candidate rule survives.** Extent 9 breaks at ratio 1.74 while extent 21 is exact at
1.24; extent 9 breaks at clearance 3.31 while extent 21 is exact at 2.50. The dipole scaling
`(R/rho)²` anti-predicts as well — it is 0.407 at an exact point and 0.332 at a broken one. Both
metrics say the *smaller* crystal is the more sensitive one, which is the opposite of what a
multipole argument predicts, so the residual is probably not a multipole-truncation effect at
all. It is not resolved here what the governing quantity is.

Three things follow, and they are what the freeze actually needs:

- **The registered domain budget rests on direct measurement at the registered configuration**,
  not on any scaling rule. There is no rule available to extrapolate with.
- **ADR 0024's stated limit is corrected** rather than removed: the effect is real and
  reproducible, and the explanation attached to it was wrong. See the erratum in that ADR.
- **The 65% domain-contact guard does not imply domain convergence.** At extent 21 it requires
  N ≥ 33, which happens to exclude the one warm configuration that breaks — but it admits cold
  at N = 40, which still carries a +0.50% attached-count error. The guard is a collision
  heuristic and cannot be read as a convergence criterion.

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
and extent 31 is what a converged *value* would require.

An earlier version of this section argued that same conclusion from the ADR 0024 ratio
`rho_far / R`, quoting 3.05 at 64³/extent 21 against 2.06 and 1.55 at extent 31, and concluding
that a value-converged measurement "would force N ≈ 96". **Both the numbers and the argument were
wrong, and the conclusion is withdrawn.** The numbers assumed the shell sits at N/2; measured,
the nearest shell cell of the `hexPrism` domain sits at ≈ 0.42·N, making those ratios 2.56, 1.73
and 1.29. The argument is the worse error: §1.3 shows the ratio does not predict the breakdown at
all. What extent 31 would cost in domain size is **not known** and would have to be measured.

The case for extent 21 stands without it, on §1.2 directly: at extent 21 the domain budget is a
measured N = 48.

**Registered minimum measurement extent: 21, for classification.** Any quantitative `AR` quoted
at that size carries the residual extent drift toward the extent-31 value, on top of the grid
systematic below.

> **Sequencing note, recorded because it was an error — and because re-running in the right
> order changed the answer.** The first domain ladder was run at extent 15 and the measurement
> extent was then chosen from these curves, so the two did not compose: domain independence had
> never been demonstrated at the size actually registered. That gap is now closed by §1.2. It did
> not merely reconfirm the old ladder at a new size — it **reversed its central conclusion**. At
> extent 15 the cold attached count climbed monotonically to 64³ and was reported as an
> unconverged systematic; at extent 21 it converges exactly by 64³. The non-convergence was an
> artefact of measuring mid-development, not a domain effect. Getting the order wrong did not
> cost confidence, it cost correctness.

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

- **The ρ_far equivariance fix is verified inert on 18 points**, bit-identical across the
  extent-15 domain ladder (10) and the timestep ladder (8, but for the one broken flag it
  corrected). That is an A/B result and the count is not inflated by later runs. The grid ladder
  (6), the extent-21 ladder (10) and the clearance probe (4) were not re-run against the
  pre-fix code; they each reported `symErr = 0` with clean incremental deltas and stand on the
  verified argument rather than on their own A/B.
- **No cross-platform control has been run.** `Math.exp`/`log`/`pow` are not specified to be
  correctly rounded, so nothing here claims bitwise reproducibility off this host. The arm64
  control remains outstanding and every claim above is scoped to the registered x64 host.
- **These are coordinator-run studies, not gate evidence.** Their conclusions feed WP0c's
  freeze; their printed metrics are not citable as a Phase 6 result.
- Wall times are contended and are not cost measurements.
