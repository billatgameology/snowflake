# 0022 — Observe negative-control ownership instead of requiring a sole criterion

- **Date:** 2026-07-25
- **Status:** accepted
- **Charter impact:** none; every negative control still has to be rejected, and no numerical
  tolerance, fixture, decision margin, or scientific meaning changes

## Context

Independent review rejected the WP5 candidate partly because "ten of sixteen negative controls
do not execute their named mutation and hardcode criterion ownership, while aggregate replay
uses substitute summary-field mutations". The producer published

```js
rejected: productionNegativeRejected(control, reports),   // `return true` for ten of them
failedCriteria: [control.owner],                          // never observed
```

Repairing that means each control's named mutation is applied to the real evidence at its real
boundary, the mutated evidence is put through the production evaluator, and `failedCriteria`
becomes the set of criteria that actually failed.

Doing so exposes why the shortcut existed. `evaluatePhase5Lane` requires

```ts
observed.failedCriteria.length !== 1 || observed.failedCriteria[0] !== expected.owner
```

— the observed failing set must be *exactly* the registered owner. At least one registered
mutation cannot satisfy that while being honest. `NC-TOLERANCE-BYPASS` means "report pass while
one blocking comparison exceeds its frozen tolerance". Any blocking comparison that exceeds
tolerance also raises its fixture's failure counts, which the evaluator routes to that fixture's
kind criterion. The mutation therefore necessarily fails both `P5-NEGATIVE-CONTROLS` and the
fixture-kind criterion. The sole-criterion rule is satisfiable only by *asserting* a singleton,
which is the defect the reviewer found: the rule incentivised the hardcoding.

The same is true in general. A mutation applied at a real boundary corrupts real evidence, and
real evidence is cross-linked; demanding that exactly one criterion notice is demanding that the
evidence graph be less connected than it is.

## Decision

- `phase5-gpu-conformance-windows-v5` is superseded by a Windows v6 protocol frozen before the
  next canonical execution. V5 remains immutable development history; it never produced an
  accepted final Phase 5 gate.
- V6 keeps the exact Windows lane, pinned runtime, fixtures, numerical field/scalar tolerances,
  decision margins, performance thresholds, negative-control roster, criterion roster, and every
  scientific meaning. Only the negative-control ownership rule, the protocol ID, and the derived
  protocol hash change.
- A negative control passes only when all of these hold:
  1. its registered mutation was applied to the evidence at the boundary the mutation names, not
     to a summary counter that merely reports on that boundary;
  2. the mutated evidence was **rejected** — either by failing criteria or by the payload-graph
     verifier refusing it structurally; and
  3. the observed failing set is non-empty and **contains** the control's registered owner.
- `failedCriteria` is the observed set, verbatim. A producer may not publish a set it did not
  observe, and the runner independently re-derives every control's outcome from the published
  payloads rather than trusting the producer's roster.

## Consequences

**Buys.** Ownership becomes a measurement. Ten controls that previously returned a hardcoded
`true` now execute a real mutation — a transposed index mapping, a zeroed far-field mask, an
inflated field statistic, a 501 ms submission segment, a full-field display readback, a shifted
endianness declaration, a post-seal artifact byte flip — and the criteria that catch them are
recorded as observed rather than asserted. The evidence graph's cross-links become visible
instead of being suppressed.

**Costs.** The gate no longer asserts that each mutation is caught by exactly one criterion, so
it no longer proves criterion *isolation*. It proves detection and correct attribution. Isolation
was never actually measured — it was hardcoded — so no real claim is lost, but the weaker
written claim must be stated plainly in the evidence prose. V5 probes must be replayed under v6.

**Forecloses.** Publishing a singleton `[owner]` that no evaluation produced; treating a
`default: return true` branch as a rejection; and satisfying the rule by choosing mutations
shallow enough to trip only one criterion.

## Alternatives considered

**Keep the sole-criterion rule and pick shallower mutations.** Rejected. It inverts the
requirement: mutations would be chosen to fit the rule rather than to execute the registered
attack, which is how the hardcoding arose.

**Keep the rule and exempt `NC-TOLERANCE-BYPASS`.** Rejected. A per-control exemption is the
same assertion in a narrower place, and the coupling is general rather than special to that
control.

**Require the owner to be the first element of the observed set.** Rejected. Criterion order is
an artifact of the roster's declaration order, not evidence.

**Drop `failedCriteria` and record only `rejected`.** Rejected. It would discard the attribution
the reviewer asked to be observed.
