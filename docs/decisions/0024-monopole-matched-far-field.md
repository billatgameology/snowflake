# 0024 — Add a monopole-matched far field

- **Date:** 2026-07-26
- **Status:** accepted
- **Charter impact:** none. §2.4 already requires every run to name its far-field condition and
  forbids comparing results across conditions silently; this adds a third named condition and
  changes no existing one. Phase 2b, 4 and 5 evidence keeps the condition that produced it.

## Context

Phase 6 WP3b transcribed the monograph's spherical solutions to give the project an absolute
accuracy anchor, and in doing so quantified something the project had only guarded against.
Our fixed-σ Dirichlet shell holds `sigma_infinity` at a finite radius. A growing crystal
depletes its surroundings, so the true supersaturation at that radius is *below* `sigma_infinity`
— clamping it there over-supplies vapor, and the closer the shell, the worse.

Eq. 3.36 gives the size of that error in closed form. With the Eq. 3.35 erratum corrected (ADR
0023's sibling finding, recorded in `docs/libbrecht-parameters.md` §1.1), the over-supply factor
is `[1 − R/(gamma·R_far)]^(−1)`, which **grows with the crystal** toward `[1 − R/R_far]^(−1)`.
At Phase 6's discriminating condition that is roughly:

| measured extent | N = 48 | N = 96 |
|---|---|---|
| 17 | 46% | 19% |
| 61 | — | 159% |

Phase 2b measured at extent 61 in 96³, so its own configuration sits near a 160% over-supply on
this estimate. The 65% domain-contact guard does not address this at all — it is a collision
heuristic, not a statement about the boundary's influence on the field.

The monograph does not accept that error either. Every canonical Libbrecht CA extends the outer
boundary to infinity by **monopole matching**, and the 3D form is printed (Eqs. 5.30–5.31,
printed p. 207 / pdf 208, transcribed from the render):

- `sigma_B(rho_far) -> sigma_inf − (dV/dt) / (4·pi·rho_far·X_0·v_kin)` (5.30), where `sigma_B` is
  an outer boundary pixel and `rho_far` is **the distance from the model's physical centre to
  that pixel** — per-pixel, not one value for the shell.
- `dV/dt = sum over surface boundary pixels of (single-pixel volume)/delta-t_b` (5.31).

`monograph-review.md` §2.4 registered this as a candidate third far-field condition "via ADR
when Phase 6 prep starts". This is that ADR.

## Decision

Add `"monopole-matched"` to `FarFieldCondition`. It clamps and meters the same outer shell as
`"dirichlet"` — same injection diagnostic, same divergence identity, same reflecting-smoother
drift accounting — and differs in the clamped **value** alone, which becomes Eq. 5.30's
per-pixel monopole-matched value instead of a flat `sigma_infinity`.

Three implementation points that are decisions rather than details:

**`rho_far` is per shell cell, and is computed from the INTEGER quadratic form.** Eq. 5.30
defines it per boundary pixel. Under the registered embedding (`x = i + j/2`, `y = j·sqrt(3)/2`,
`z = k`) the squared distance from the centre is

`(di + dj/2)² + 3·dj²/4 + dk² = di² + di·dj + dj² + dk²`

— an integer that rot60 `(di, dj) → (−dj, di + dj)` and mirror `(di, dj) → (dj, di)` preserve
exactly. `rho_far` is therefore bitwise identical across an orbit, the shell stays exactly
symmetric, and ADR 0023's guarantee is untouched.

> **Erratum on this ADR's own first implementation (same day).** The distance was first computed
> the obvious way, by evaluating the cartesian coordinates in float64 and taking
> `sqrt(dx² + dy² + dz²)`. That is invariant in exact arithmetic and **not** invariant once
> evaluated: symmetry-equivalent shell cells came out differing by up to ~7e-15, which
> propagated into the clamped shell value and broke D6h. It was caught by the WP3 timestep
> ladder, where warm 48³ at `cflFill = 0.2` reported `deltaSymClean = false`, and reproduced in
> seconds at 32³ — where the break appears **only** under `monopole-matched` at `cfl = 0.2`,
> never under `dirichlet` and never at `cfl = 0.1`. A larger step lets many cells cross the
> attachment threshold together, which is what turns a ulp into a split orbit.
>
> This is exactly the hazard ADR 0023 is about, reintroduced by the ADR that cites it. The
> lesson generalises past both: **a quantity that is invariant in exact arithmetic is not
> automatically invariant once evaluated** — the invariance has to survive the floating-point
> expression chosen to compute it, and the cheapest way to guarantee that is to key the value to
> an integer the group preserves. The regression is now pinned two ways: a bitwise equality
> assertion on `rho_far` across each orbit that needs no growth at all, and an end-to-end
> symmetry run **at `cfl = 0.2`**, the amplifying setting the original test missed by using 0.1.

**The per-site volume in Eq. 5.31 is derived from our own embedding, not transcribed.** Sites
sit on a triangular lattice of unit nearest-neighbour spacing, whose Voronoi cell has area
`sqrt(3)/2`, with unit layer spacing, giving `(sqrt(3)/2)·Δx³` per site. The monograph's
`G_1 = 2/sqrt(3)` is the same volume under its own convention, in which Δx is the ROW spacing
rather than the nearest-neighbour distance. Transcribing the constant instead of deriving it
would have silently applied their convention to our lattice.

**`dV/dt` lags by one growth step, and that is registered rather than hidden.** The shell has to
be set before the relaxation whose surface solution determines the current `dV/dt`, so the value
used is the last completed interface update's. Before the first update it is exactly zero, which
makes the first relaxation's shell exactly `sigma_infinity` — the monopole correction cannot be
known before any growth has been measured.

`"dirichlet"` and `"reflecting"` are bit-unchanged. Gate 2b's option builder pins `"dirichlet"`
explicitly so a completed gate cannot acquire a different boundary condition by default drift,
and the `grow-lk` default stays `"dirichlet"` so every executed command replays.

## Consequences

**Buys.** The measured effect is the one the change is for: growing the same crystal for 60
steps at −5 °C, σ∞ = 0.0075, the fixed-σ shell gives 279 attached cells at 32³ against 255 at
48³ — an 8.6% swing from the domain size alone — while the monopole shell gives **231 at both**,
with an identical aspect ratio. The shell values behave as the physics requires, depleting more
at the closer boundary (down to 6.27e−3 against `sigma_infinity` = 7.5e−3 at 32³, and only to
6.71e−3 at 48³). Symmetry stays exactly zero and every relaxation still converges under the
divergence identity.

That result also means the domain-convergence study can now be run against a boundary condition
that is not itself the dominant error, which is what WP3 needs before any grid can be frozen.

**Costs.** A third condition to carry in the type, the checkpoint validator, the CLI and every
place that branches on the far field — mitigated by routing the shared clamp-and-meter behaviour
through one predicate rather than repeating a string comparison at eleven sites.

More importantly, **it changes the answer**. In the same comparison the aspect ratio moves from
0.5000 under fixed-σ Dirichlet to 0.3000 under monopole matching — a materially thinner plate.
That is the expected direction (less over-supply means more facet-dominated growth), but it
means no calibration number, threshold or habit classification measured under the Dirichlet
shell transfers to a monopole-matched sweep. Everything WP0c freezes has to be measured under
the condition the sweep will actually run.

The one-step lag in `dV/dt` is a real approximation, not a bookkeeping convenience. It is
first-order in the growth-step size and is expected to matter least where growth is slowest,
which is where Phase 6's discriminating conditions sit — but it is untested at large steps and
is a candidate explanation for any residual domain dependence WP3 finds.

**It has a validity limit, and the limit is measurable.** Eq. 5.30 treats the crystal as a point
source, so it needs `rho_far` comfortably larger than the crystal. Measured on the same
configuration, 28³, 32³ and 48³ all return an identical attached count, while 20³ — where the
nearest shell cell sits only about 2.3 crystal radii out — returns a different one. **Monopole
matching therefore does not make domain size irrelevant; it moves the threshold outward and
makes the residual measurable.** WP0c must still set the minimum domain from the WP3 ladder, and
must set it under this condition rather than inheriting a Dirichlet-era number. The leading
neglected term is the dipole, of order `(R/rho_far)²`, which is the right quantity to bound; the
bound itself is deliberately not invented here and is left to measurement.

> **Erratum on the paragraph above (WP3, `research/phase6-convergence.md` §1.3).** The effect is
> real and reproduces exactly — 20³ returns 105 attached where 24³ through 48³ all return 81 —
> but two claims about it are wrong.
>
> **The number is wrong.** The nearest shell cell at 20³ sits at 7.81 cells against a crystal
> half-extent of 4.5, a ratio of **1.74**, not "about 2.3". The 2.3 came from assuming the shell
> sits at N/2; the `hexPrism` domain's nearest shell cell is at ≈ 0.42·N.
>
> **The explanation is wrong.** WP3's extent-21 domain ladder is bit-identical from N = 32 to
> N = 80, and its N = 40 point sits at ratio 1.57 — *below* the 1.74 that breaks here — so the
> ratio does not order the two observations. Absolute clearance does not either (breaks at 3.31
> cells, exact at 2.50 at the larger crystal), and the dipole term `(R/rho_far)²` anti-predicts:
> 0.407 at an exact point against 0.332 at a broken one. Every candidate makes the *smaller*
> crystal the more sensitive one, which is the reverse of a multipole-truncation argument, so the
> residual is probably not multipole truncation. **The governing quantity is not identified.**
>
> The operative consequence is unchanged and now rests on firmer ground: the minimum domain must
> be **measured at the configuration that will actually be run**, because no scaling rule is
> available to extrapolate one configuration's limit to another. WP3 §1.2 does exactly that.

**Forecloses.** Reading a fixed-σ Dirichlet result as domain-independent because it passed the
65% contact guard. Comparing a monopole-matched run against a Dirichlet run without naming the
difference. Retrofitting this condition onto Phase 2b, 4 or 5 evidence.

## Alternatives considered

**Keep fixed-σ Dirichlet and simply use larger domains.** Rejected on arithmetic. The bias falls
only as ~1/N, so cutting the extent-61 case from ~159% to ~15% needs roughly a tenfold larger
domain — a thousandfold cell count in 3D. The sweep is already hours per point.

**Keep fixed-σ Dirichlet and correct the measured results analytically using Eq. 3.36.**
Rejected. The closed form is isotropic and assumes an isolated sphere; a plate's prism tips sit
far closer to the wall than its basal faces, so the real bias is **differential per facet** and
a scalar correction would leave exactly the part that changes habit. The closed form is fit to
set expectations, not to correct results.

**Subtract a uniform monopole term rather than a per-pixel one.** Rejected. Eq. 5.30 is explicit
that `rho_far` is measured to each boundary pixel, and on a hexagonal prism the shell distances
vary substantially; flattening them would reintroduce an anisotropic boundary error of the same
kind being removed.

**Solve the shell value implicitly with the current step's `dV/dt`.** Rejected for now as
disproportionate: it requires an outer iteration around a relaxation that already runs thousands
of sweeps, for a correction whose lag error is first order in a deliberately small growth step.
Recorded here as the fix if WP3 finds residual domain dependence that the lag explains.
