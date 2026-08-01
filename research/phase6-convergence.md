# Phase 6 numerical verification — the four convergence studies

> **CORRECTED STATUS 2026-08-01 — historical, non-transferable reconnaissance; numerical
> adequacy remains open.** This report ran under `CAK_A1` and its grid ladder changed lattice seed
> representation and achieved physical size with spacing. The later registered domain spot-check
> failed N = 48 against N = 64 at 3/4 points, and the N = 64 against N = 80 escalation also failed
> 3/4. Therefore the statements below that habit class is robust on every axis, the sweep is
> viable, N = 48 is adequate, the domain ladder generalises across habits, or the cold grid-limit
> class is settled are **retracted as current conclusions**. The tabulated runs remain historical
> measurements at their executed configurations. They do not close R15 and cannot select the new
> production configuration. The governing replacement is
> `docs/plans/phase-6-science-first-completion.md`, WP2–WP4.

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

## Historical summary — superseded by the correction above

**The habit CLASS is robust on every axis. The value underneath converges late or not at all on
three of the four — and on the fourth, grid spacing, it does not converge in any usable sense at
the warm condition.**

| axis | class converged at | value converged at |
|---|---|---|
| domain N, at extent 21 | 40 | 48 to 0.04%, exact from 64 |
| timestep `cflFill` | every value tested (8× range) | 0.05 |
| measurement extent | 9 warm / 11 cold | 9 warm / 31 cold |
| grid Δx, at extent 21 | **every spacing tested (3× range)** | cold extrapolates; **warm does not** |

This is what the sweep may and may not claim. Habit classifications are robust and the sweep is
viable on them. Any statement about *how far* a point sits from a classification threshold
inherits an unconverged systematic and must carry it.

**Two of these rows read the opposite way when the studies were first run**, because both were
measured at a convenient crystal size rather than the registered one. Re-running the domain and
grid ladders at the registered measurement extent reversed both conclusions — see §1.1 and §4.1.
The recurring lesson is recorded once here: **a convergence study measured at a size other than
the one being registered does not compose with the registration, and in this project it has
twice produced the wrong answer rather than merely a less precise one.**

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

## 4. Grid spacing

Fixed physical box 16.8 µm and fixed physical measurement size; N and target extent scale with
Δx so the physics compared is identical.

### 4.1 At extent 9/15/23 — superseded, and wrong about the class flip

| Δx (µm) | N | extent | warm attached / AR | cold attached / AR |
|---|---|---|---|---|
| 0.700 | 24 | 9 | 67 / 0.3784 plate | 141 / **0.6307 plate** |
| 0.350 | 48 | 15 | 521 / 0.3810 plate | 1505 / **0.9905 neutral** |
| 0.2333 | 72 | 23 | 2325 / 0.4488 plate | 6951 / **1.0952 neutral** |

This ladder was run at a physical measurement size of **5.25 µm** (extent 15 at Δx = 0.35), not
the registered **7.35 µm** (extent 21) — the same test/experiment composition error that reversed
§1. Its two headline claims were **"Δx = 0.7 changes the habit class"** and an extrapolation to
*warm ≈ 0.584, cold ≈ 1.305* assuming first order. §4.2 re-ran it at the registered size.
**Both claims are withdrawn**, and the reasons differ:

- The class flip was an artefact of the measurement size, not of the grid.
- The single order 0.291 quoted as "approximately first order" was computed from the **cold**
  pair alone and then applied to warm as well. Warm's own successive differences at those extents
  were 0.0026 then 0.0678 — they **grew by 26×** under refinement, which no positive convergence
  order permits. The warm limit 0.584 was therefore never supported by warm data, and its whole
  signal (0.070) was smaller than the ±0.07 lattice-discreteness band §3 reports for warm.

Found by the 2026-07-27 independent review.

### 4.2 At the registered measurement size — extent 21

Same fixed physical box and the registered 7.35 µm measurement size; `cflFill` = 0.1, v6,
monopole-matched. Every point `symErr = 0`, `deltaSymClean = true`, all relaxations converged.

| Δx (µm) | N | extent | warm attached / AR | cold attached / AR |
|---|---|---|---|---|
| 0.7000 | 24 | 11 | 183 / 0.3106 plate | 427 / **0.7246 neutral** |
| 0.3500 | 48 | 21 | 1513 / 0.3821 plate | 5161 / **1.1053 neutral** |
| 0.2333 | 72 | 33 | 8425 / 0.4194 plate | 16871 / **1.2222 neutral** |

**Δx = 0.7 does NOT change the habit class.** Cold reads neutral at all three spacings and warm
reads plate at all three. **The habit class is stable across the full 3× range of grid spacings
tested**, which is the opposite of §4.1's conclusion and the third WP3 study to reverse when
re-measured at the registered crystal size.

**The convergence order is fitted, not assumed.** The refinement ratios are non-uniform
(0.7 → 0.35 is ×0.5, 0.35 → 0.2333 is ×⅔), so for `AR(h) = AR₀ + C·h^p` the expected ratio of
successive differences is itself a function of `p`; first order would give 0.3333.

| | differences | ratio | fitted `p` | Richardson at fitted `p` | at `p` = 1 |
|---|---|---|---|---|---|
| warm | +0.0715, +0.0373 | 0.5217 | **0.207** | 0.8445 → *neutral* | 0.4940 → *plate* |
| cold | +0.3807, +0.1169 | 0.3071 | **1.142** | 1.4207 → neutral | 1.4560 → neutral |

**Cold is approximately first order and its limit is robust.** Both estimates land at 1.42–1.46,
comfortably inside neutral and **below the 1.5 column floor**. The cold condition therefore does
not reach column at f = 0.15 *even in the grid limit* — that is a measurement, not an assumption.

**Warm is NOT extrapolatable, and this is registered as a limit rather than papered over.** Its
fitted order is 0.207, far below first, and the extrapolated **class changes with the assumed
order** — neutral at the fitted order, plate at first order. An extrapolation whose answer depends
that strongly on a fitted exponent carries no information about the class. Warm's measured class
is plate at every spacing tested and that is what may be reported; no warm grid-extrapolated
class may be.

> **Registered extrapolation operator.** First-order Richardson on the two finest spacings,
> `AR₀ = AR(h₂) + (AR(h₂) − AR(h₁)) / ((h₁/h₂) − 1)`, applied **only** where the fitted order
> lies in [0.7, 1.5]. Outside that window the point is reported `not-extrapolatable` and carries
> its measured class alone. At the registered conditions cold qualifies (p = 1.142) and warm does
> not (p = 0.207).

### What this does to the cold reading

§4.1 combined an extent extrapolation with a grid extrapolation to put a fully converged cold
`AR` near 1.47 — "essentially on the 1.5 column boundary" — and called the neutral/column
question the most consequential open measurement in Phase 6. **That is now measured directly and
the answer is neutral.** At the registered measurement size the cold value is 1.2222 at the
finest spacing and extrapolates to 1.42–1.46, still short of 1.5 on both estimates. The margin is
not large, but it no longer rests on an extrapolation of an extrapolation.

**The disagreement with Nakaya survives either way**, which is why this does not change the
registered expectation: if cold is neutral, the model produces no reversal at f = 0.15; if it
were column, it would produce a reversal in the **opposite sense** to the diagram, whose −9.9 °C
boundary separates columns on the warm side from plates on the cold side. The model's single σ₀
crossing at −10.1 °C runs plate-warm → column-cold.

**Caveat carried on the finest points.** They stopped at extent 33 rather than the targeted 32,
so their physical measurement size is 7.70 µm against the registered 7.35 — 4.7% large. §3's
cold trajectory rises about 0.01 per extent unit in that range, so the effect on the cold value
is of order +0.01 and does not move any conclusion above.

## 5. Seed shape — a systematic, not a convergence axis

Every run in this project starts from the same seed: the canonical 19-site hexagon, radius 2,
**thickness 1** — which is itself plate-like, aspect ratio 1/5 by construction. Since the cold
call sits nearest a class threshold, "does the plate-like seed bias the result toward plate?" is
a question the sweep should not leave unasked. Seed thickness must be **odd** (the seed is
symmetric about the centre plane), so the alternative is thickness 3, not 2.

Registered configuration otherwise unchanged; both points `symErr = 0`, clean, converged.

| condition | seed thickness | steps | attached | `AR` | class |
|---|---|---|---|---|---|
| warm | 1 (registered) | 145 | 1513 | 0.3821 | plate |
| warm | 3 | 160 | 2423 | **0.6004** | plate |
| cold | 1 (registered) | 316 | 5161 | 1.1053 | neutral |
| cold | 3 | 267 | 4135 | **1.2353** | neutral |

**The habit class is invariant to seed shape at both conditions.** That is the result the sweep
needs, and it is the reassuring one.

**The value is not, and warm's shift is the largest single systematic measured in this phase** —
`AR` +0.218, or **+57%**, against the grid systematic's +10.6% cold. It is directional in the
expected way: a thicker seed starts less plate-like and stays less plate-like. Warm's margin to
the 0.667 plate ceiling goes from comfortable to thin (0.6004 is inside the extent-fragile band),
while cold moves +0.130, almost exactly the registered extent-drift bound.

Note also that cold at thickness 3 reaches the measurement size in **fewer** steps with **fewer**
attached cells (267/4135 against 316/5161): the thicker seed spends less growth becoming
three-dimensional, so it arrives at extent 21 sooner and less dense.

**What must not be done with these numbers.** Cold's registered value is 1.1053; the grid limit
is 1.42–1.46; seed shape adds +0.13; extent drift adds up to +0.135. Stacking those gives ~1.7,
above the 1.5 column floor — and that is **not a result**. It is an extrapolation of
extrapolations, the exact error §4.1 was retracted for. The systematics are not established to be
independent or additive, and each one *individually* leaves cold neutral. The honest statement is
that cold is neutral under every single-axis perturbation measured, and that no combined estimate
is available.

> **Why this is recorded here and NOT added to the frozen protocol.** The 204-point sweep was
> running when these numbers landed. Charter §3.2 Phase 6 item 1 says a post-freeze protocol edit
> invalidates prior sweep results and the sweep re-runs in full, so amending the protocol
> mid-sweep would have thrown away the run to record a caveat. It does not need to be in the
> protocol: the registered seed is unchanged, this changes nothing about what executes, and it is
> a *reported systematic* rather than a value. The asymmetry that makes that safe is worth being
> explicit about — **adding a caveat after seeing data can only weaken a claim, never strengthen
> it**, so it does not need pre-registration the way a threshold does.

---

## Validity, and what is not established here

- **The ρ_far equivariance fix is verified inert on 18 points**, bit-identical across the
  extent-15 domain ladder (10) and the timestep ladder (8, but for the one broken flag it
  corrected). That is an A/B result and the count is not inflated by later runs. The two grid
  ladders (6 + 6), the extent-21 domain ladder (10) and the clearance probe (4) were not re-run
  against the pre-fix code; they each reported `symErr = 0` with clean incremental deltas and
  stand on the verified argument rather than on their own A/B.
- **The registered grid-extrapolation operator is validated at exactly two conditions, and it
  refuses one of them.** Nothing here establishes that the fitted order stays inside the
  [0.7, 1.5] admission window elsewhere on the sweep grid, so every point must have its own order
  fitted and may come back `not-extrapolatable`. The operator is not a licence to extrapolate
  everywhere; it is a test each point has to pass.
- **The cross-platform control has now been run (2026-07-31), and it splits.** `Math.exp`/`log`/
  `pow` are not specified to be correctly rounded, and the two architectures measurably differ:
  the tier-1 libm fingerprint is `2a9f64b3` on x64 and **`3662b9e2`** on arm64 (Apple M4, macOS
  26.5.2, Node v24.13.1, V8 13.6.233.17-node.40 — the same engine build as the x64 host, so the
  difference is architecture and platform libm, not engine version). **No bitwise reproducibility
  claim extends off a single architecture**, and none is made here.
  **Habit class, however, reproduced exactly at all four registered fixture points** — same steps,
  same attached count, same aspect ratio — including `fragile-column-floor` on its exact `AR`
  = 1.5000 tie on the column floor. So the habit-class conclusions at those four points are
  portable across x64 and arm64, while everything digit-level above remains scoped to the
  registered x64 host. Four points is not the 204-point sweep: see
  `docs/phase6-cross-platform-control.md` §Result for the full table, the wall times, and what
  the evidence explicitly does not establish.
- **These are coordinator-run studies, not gate evidence.** Their conclusions feed WP0c's
  freeze; their printed metrics are not citable as a Phase 6 result.
- Wall times are contended and are not cost measurements.
