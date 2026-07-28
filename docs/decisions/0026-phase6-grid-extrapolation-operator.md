# 0026 — The Phase 6 grid-extrapolation operator, and the retraction of the first grid ladder

- **Date:** 2026-07-27
- **Status:** accepted
- **Charter impact:** none. Amends the WP0c protocol pre-sweep; `PHASE6_PROTOCOL_SHA256` moves
  `0050040e` → `a9f0ad21`. No sweep has run, so nothing is invalidated.

## Context

WP0c's uncertainty-reporting scheme consumes a per-point **grid-extrapolated habit class** and
never registered how that extrapolation is computed. An operator chosen after seeing results is
exactly the freedom the freeze exists to remove. The 2026-07-27 independent review found the gap
and two defects in the ladder the operator would have been built on.

**Defect 1 — the ladder was measured at the wrong crystal size.** `research/phase6-convergence.md`
§4 was run at extents 9/15/23, a physical measurement size of 5.25 µm, while the registered size
is 7.35 µm (extent 21). That is the same test/experiment composition error that reversed the
domain conclusion in §1.

**Defect 2 — the quoted convergence order was computed from one temperature and applied to both.**
§4 stated "successive changes fall by a factor 0.291 against the 0.333 expected for first order,
so the convergence is approximately first order" and extrapolated *both* conditions from it. The
0.291 is the **cold** pair. Warm's own successive differences at those extents were +0.0026 then
+0.0678 — they **grew by a factor 26 under refinement**, which no positive convergence order
permits. The published warm limit `AR → 0.584` was never supported by warm data, and warm's whole
grid signal (0.070) is smaller than the ±0.07 lattice-discreteness band §3 reports for warm.

The ladder was therefore re-run at the registered measurement size before this operator was
frozen.

## Decision

**1. §4.1 is retracted and superseded by §4.2**, the ladder re-run at the registered extent 21
(fixed 16.8 µm box, fixed 7.35 µm measurement size, `cflFill` 0.1, v6, monopole-matched; every
point `symErr = 0`, `deltaSymClean = true`, all relaxations converged).

| Δx (µm) | N | extent | warm `AR` | cold `AR` |
|---|---|---|---|---|
| 0.7000 | 24 | 11 | 0.3106 plate | 0.7246 **neutral** |
| 0.3500 | 48 | 21 | 0.3821 plate | 1.1053 **neutral** |
| 0.2333 | 72 | 33 | 0.4194 plate | 1.2222 **neutral** |

**"Δx = 0.7 changes the habit class" is withdrawn.** At the registered measurement size the class
is stable across the full 3× range of spacings — plate at all three warm, neutral at all three
cold. The flip was an artefact of measuring a crystal at extent 9.

**2. The operator is first-order Richardson on the two finest spacings, admitted only where the
fitted order is credible.**

> `AR₀ = AR(h₂) + (AR(h₂) − AR(h₁)) / ((h₁/h₂) − 1)`, applied only when the order fitted from
> all three spacings lies in **[0.7, 1.5]**. Outside that window the point is reported
> `not-extrapolatable` and carries its measured class alone.

The order is **fitted, not assumed**. The refinement ratios are non-uniform (×0.5 then ×⅔), so
the expected ratio of successive differences is itself a function of `p`; assuming first order is
what produced the withdrawn warm limit.

| | differences | ratio | fitted `p` | outcome |
|---|---|---|---|---|
| cold | +0.3807, +0.1169 | 0.3071 | **1.142** | admitted, `AR₀` = 1.456 |
| warm | +0.0715, +0.0373 | 0.5217 | **0.207** | **refused** |

**3. Warm is refused, and the admission window exists because of exactly this case.** At warm the
extrapolated *class* changes with the assumed order — **0.8445 (neutral) at the fitted order,
0.4940 (plate) at first order**. An extrapolation that sensitive to a fitted exponent carries no
information about the class, so it must be refused rather than reported with a caveat.

**4. The headline is the conservative intersection.** Points whose measured class agrees **and**
whose admitted extrapolation does not contradict it, over the 15 headline-scope counting
temperatures (ADR 0025). The two component counts and the `not-extrapolatable` tally are reported
beneath it, never as the top line. Counting agreement twice and quoting the friendlier number is
the failure mode a dual report invites.

## Consequences

**The most consequential open question in Phase 6 is now closed by measurement, and the answer is
neutral.** §4.1 combined an extent extrapolation with a grid extrapolation to put a converged cold
`AR` near 1.47 — "essentially on the 1.5 column boundary" — and concluded that neutral-vs-column
was decided by numerics rather than physics. Measured at the registered size, cold is 1.2222 at
the finest spacing and extrapolates to **1.42–1.46, below the 1.5 column floor on both
estimates**. The cold condition does not reach column at f = 0.15 even in the grid limit.

**This is the third WP3 study to reverse when re-measured at the registered crystal size** (after
the domain ladder, and after ADR 0024's ratio-based validity limit). The pattern is now recorded
once, at the top of the convergence report: a convergence study measured at a size other than the
one being registered does not compose with the registration, and in this project it has twice
produced the *wrong answer* rather than merely a less precise one.

**The operator is validated at two conditions and refuses one of them.** Nothing establishes that
the fitted order stays inside the admission window elsewhere on the sweep grid, so every point
fits its own order and may come back `not-extrapolatable`. The operator is a test each point must
pass, not a licence to extrapolate everywhere.

**Warm grid-extrapolated classes may not be reported at all** at the registered conditions. Warm's
measured class is plate at every spacing tested, and that is what may be said.

**Forecloses.** Assuming first order because one temperature happened to show it. Reporting an
extrapolated class whose value depends on a fitted exponent. Quoting the friendlier of two
agreement counts as the headline. Citing §4.1's warm limit 0.584 or its class-flip claim.

## Alternatives considered

**Report the warm extrapolation with a caveat instead of refusing it.** Rejected. The caveat
would have to say "this class may be either plate or neutral depending on an exponent we fitted
from three points", which is not a result. A number that carries a caveat that large is better
reported as absent.

**Widen the admission window to include warm.** Rejected as fitting the rule to the data — the
window would have to reach 0.2, which admits sequences that are barely converging at all.

**Use all three points in a least-squares fit rather than two-point Richardson.** Rejected as
false precision: with three points and a fitted exponent there are no residual degrees of
freedom, so the fit would look better without being better. The admission test already uses all
three; the extrapolation deliberately uses the two finest, which are the ones closest to the
limit being estimated.

**Re-run the ladder at a fourth, finer spacing to pin the order.** Deferred, not rejected. Δx =
0.175 (96³, extent 42) is roughly 12× the cost of the 0.2333 point measured in WP0c, several days
per condition. It would tighten the fitted order and is the right move if a sweep point's class
turns on the extrapolation — which, given the cold margin of 0.04–0.08 below the column floor, may
yet happen.
