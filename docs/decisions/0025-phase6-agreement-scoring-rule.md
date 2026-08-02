# 0025 — The Phase 6 agreement-scoring rule

- **Date:** 2026-07-27
- **Status:** accepted
- **Evidence correction (2026-08-01):** the pure-class flip operator, bracketing rule, and scoring
  policy remain accepted. The later statement that one monotone `sigma0` crossing can produce at
  most one habit flip is **retracted**: morphology depends on each facet's full local `alphaHK`,
  evaluated at the solver-produced surface field, plus diffusion, geometry, seed and size evolution.
  One shared-field `alphaHK` ordering is only a restricted function diagnostic. A `sigma0` crossing
  count is not a structural bound on habit flips. Historical flip counts remain measurements of
  the executed ladders only.
- **Charter impact:** none, and per Rule 5 here are the clauses that make it none. §3.2 Phase 6
  item 1 requires:

  > "Before the first validation sweep runs, freeze `docs/libbrecht-parameters.md` and a written
  > validation protocol: the T/σ grid; … metric thresholds; … and the uncertainty-reporting
  > scheme."

  This ADR *fills* an omission in that list rather than changing what it demands — the list
  already requires the comparison design be frozen pre-sweep, and the class-to-regime mapping was
  simply missing from the protocol that claimed to implement it. The same clause governs the cost:

  > "Any post-freeze edit to parameters or protocol requires a logged ADR and invalidates prior
  > sweep results — the full sweep re-runs."

  This is that logged ADR. It amends the WP0c protocol (`8e48025`) pre-sweep, so
  `PHASE6_PROTOCOL_SHA256` moves. **No sweep had run at the time of writing**, so no results were
  invalidated. (Charter v1.17 subsequently added this row to the §3.2 freeze list by name, via
  ADR 0027.)

## Context

An independent review on 2026-07-27 found that WP0c froze the T/σ grid, the ambiguity band, the
habit thresholds and the uncertainty scheme — and never registered **how a model habit class is
scored against the reference**. Nothing mapped `{plate, column, neutral, invalid}` onto the four
regimes of `research/nakaya-morphology-diagram.md` (`Plates | Columns | Plates | Columns and
Plates`).

That is a live post-hoc degree of freedom, and it is not a small one. Three examples of what was
undecided, each of which could have been settled after seeing results:

- **`neutral` had no score at all.** The neutral band spans `AR` 0.667–1.5, a factor 2.25, and
  WP3 measured the cold discriminating point at 1.1053 — squarely inside it. Whether that counts
  as disagreement or as abstention changes the headline number dramatically, and the choice would
  have been made while looking at how often it occurred.
- **The mixed cold regime accepts both pure classes**, and it holds **13 of the 28** counting
  temperatures. Folded into one percentage, 46% of the evidence budget scores agreement for
  almost any non-neutral result.
- **Nothing defined where a model "flip" is**, or how many the model produced, which is the
  quantity the registered expectation is actually about.

## Decision

Register the scoring rule in `runner/src/phase6-protocol.ts`, before any sweep.

**Regimes are half-open intervals `(colderBoundC, warmerBoundC]`** keyed to the digitized
boundaries −3.3, −9.9, −21.5 °C, so a temperature exactly on a boundary belongs to the regime on
its cold side and every temperature lands in exactly one regime. The convention is arbitrary and
never affects a score — a boundary temperature is always inside the ambiguity band — but a total
function must not be ambiguous about it. A test asserts single-valuedness across the whole axis.

**The accepted-class matrix:**

| regime | span | accepts | headline |
|---|---|---|---|
| `plates-warm` | T > −3.3 | `plate` | yes |
| `columns` | −3.3 ≥ T > −9.9 | `column` | yes |
| `plates-cold` | −9.9 ≥ T > −21.5 | `plate` | yes |
| `columns-and-plates` | T ≤ −21.5 | `plate`, `column` | **no** |

Collapsing morphology onto the plate/column axis is the figure's own framing, not a reduction
imposed here: its top-row labels are already plate/column words, its dendrites and sectored
plates are plates by aspect ratio, and its needles are columns.

**`neutral` scores DISAGREE.** The reference names a habit in every regime. The neutral band is
*ours*, not the reference's, and a model producing neither habit has failed to reproduce the
reference. Scoring it as abstention would let a model that never commits report perfect agreement
on whatever few points it did commit on. **The neutral count is published separately**, so a
reader can always distinguish "wrong habit" from "no habit" — which is the distinction that
carries the science.

**`invalid` scores EXCLUDED, by name.** A run that tripped the 65% domain-contact guard, broke
D6h symmetry, or failed to converge is not a statement about the model; it is a run that did not
happen. The plan already requires such runs be excluded by name rather than dropped silently.

**The headline claim is restricted to −2…−21.5 °C — 15 counting temperatures.** The cold regime
is still swept and still reported, with its own count, but separately. Two reasons, and the first
is sufficient alone:

1. `Columns and Plates` accepts both pure classes, so those 13 points score agreement nearly for
   free. Worse, that regime describes a **population** of natural free-falling crystals while a
   grid point here is **one deterministic crystal** — matching a mixed population with a single
   run is ill-posed however the score is defined.
2. The coldest regime is reportedly disputed observationally (Bailey & Hallett 2009, via
   `docs/stretch-sharing-and-investigation.md`). That source is **sweep-reported and not verified
   in-repo**, so it is recorded as corroboration only and carries no weight on its own.

**Flips are bracketed, never pinpointed.** `phase6DetectFlips` scans warm→cold and reports the
interval between the last temperature of one pure class and the first of the other, with the
interval width as the location uncertainty. Neutral and invalid points do not terminate a scan —
they *widen* the bracket, which is the honest representation. A wide neutral span means the flip
is poorly located, and collapsing it to a midpoint would manufacture precision the grid does not
have. **The number of flips is itself a first-class result**: the reference has three. The former
single-`sigma0`-crossing structural bound is retracted by the correction at the head of this ADR.

**The per-regime evidence budget is published pre-sweep**, alongside the existing 28/6 split:

| regime | counting | ambiguous |
|---|---|---|
| `plates-warm` | **1** | 1 |
| `columns` | 4 | 2 |
| `plates-cold` | 10 | 2 |
| `columns-and-plates` | 13 | 1 |

## Consequences

**A stated limitation rather than a discovered one: the warmest Plates regime has exactly ONE
counting temperature (−2 °C).** It can therefore only ever score 0% or 100% and carries
essentially no statistical weight. It is deliberately not padded by extending the grid warmer:
−1 °C is the only candidate, and it sits where the unapplied latent-heating systematic is largest
(`chi_0 ≈ 0.8`, a ~1.8× correction to the driving supersaturation). Importing the worst
systematic in the phase to buy one point is a bad trade. Any conclusion about the warm plate
regime is a one-point conclusion and must say so.

**The headline denominator drops from 28 to 15.** That is a real loss of apparent statistical
power and it is the correct trade: the 13 discarded points were never going to discriminate.

**`PHASE6_PROTOCOL_SHA256` moves.** The freeze is amended, not unwound — this is the mechanism
the charter provides, and it is free right now precisely because no sweep has run. After the
first sweep the same change would cost a full re-sweep.

**Forecloses.** Deciding after results whether `neutral` counts. Reporting a single agreement
percentage across all four regimes. Quoting a flip temperature to a precision the grid spacing
does not support. Dropping an invalid run without naming it.

## Alternatives considered

**Score `neutral` as abstention (excluded from numerator and denominator).** Rejected. It is the
choice that flatters the model most, and it does so exactly where the model is weakest — WP3's
cold point is neutral. A rule whose effect is to delete the inconvenient measurements is not a
scoring rule.

**Keep all 28 temperatures in one headline number.** Rejected: 46% of it would be near-free
agreement from a regime that accepts both answers, and the resulting percentage would be
reported and remembered without its composition.

**Split `neutral` into "leans plate" / "leans column" by which side of 1.0 it falls.** Rejected as
inventing resolution the metric does not have. The thresholds 0.667 and 1.5 are registered
precisely because the region between them is where the aspect ratio does not determine a habit;
subdividing it by an unregistered midpoint would smuggle a fourth threshold in after the freeze.

**Define the flip as the midpoint between adjacent differing classes.** Rejected: it reports a
single number where the data supports an interval, and it would silently absorb neutral spans —
turning "the model never commits between −5 and −15" into "the model flips at −10".
