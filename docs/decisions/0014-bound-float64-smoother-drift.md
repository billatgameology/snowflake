# 0014 — Bound the aggregate-v5 float64 smoother drift

- **Date:** 2026-07-19
- **Status:** accepted; tightens decision 0013 before any v5 morphology execution
- **Charter impact:** §2.4 and Phase 2b updated in this session (charter v1.11 → v1.12)

## Context

Decision 0013 requires aggregate v5 to meter the signed field change created by the float64
reflecting smoother and include it in the Dirichlet divergence identity. Its first implementation
required that term to be finite but did not bound its magnitude. An adversarial review showed
that a coherently forged report with shell injection `1`, surface exchange `1e-6`, and drift
`-0.999999` could satisfy the corrected identity. More importantly, the same omission would let
a genuinely non-conservative smoother defect be labeled roundoff and canceled by the new term.
That contradicts the decision's stated diagnostic scope.

The existing smoother evaluates one output with about twelve rounded arithmetic operations. The
direct meter subtracts the sweep input and accumulates blocks of 256 terms before a compensated
outer sum. For a field bounded in magnitude by `S`, the first-order forward-error coefficient is
therefore below the per-block 255 additions plus the local stencil/subtraction work. A factor of
1024 against `Number.EPSILON` supplies more than a factor-three safety margin over that operation
count while remaining explicitly at aggregate float64-roundoff scale.

## Decision

1. Every aggregate-v5 sweep computes the independent absolute bound

   ```text
   smootherDriftAbsLimit =
     1024 * Number.EPSILON * activeCellCount * maxAbsSweepInput
   ```

   where `maxAbsSweepInput` is measured over active unattached cells before the smoother. A zero
   field has a zero bound and zero drift.
2. The solver must reject a non-finite drift or any
   `abs(smootherDrift) > smootherDriftAbsLimit`; such a sweep is not convergence evidence.
3. The registered positive-supersaturation, fixed-temperature Phase 2b runner independently uses
   the discrete maximum principle to set its gate bound with
   `maxAbsSweepInput = sigmaInfinity`. It passes that bound separately to the evidence validator;
   it may not accept a report-supplied scale. The validator must reject a coherently adjusted
   drift/divergence pair whose drift exceeds the bound.
4. Both the three-term divergence tolerance and this absolute roundoff bound are load-bearing.
   Passing one does not excuse failing the other. The actual drift and bound are printed in v5
   evidence.
5. Legacy-v3, aggregate-v4, their checkpoints, and completed Phase 4 evidence remain unchanged.

## Consequences

- The registered cold checkpoint's measured `1.1395225041344048e-13` drift remains admissible;
  the 96³ gate bound is approximately `2.9e-10`, depending on the exact active-cell count.
- Arbitrary loss cannot be renamed float64 drift even if shell, exchange, drift, and divergence
  are forged coherently.
- The bound is deliberately conservative because it covers the block accumulator as well as the
  stencil. It is not a measurement of expected error and must not be used as a tuning target.
- A future smoother or accumulator change must re-derive this operation-count bound or introduce
  a new policy. Silently retaining 1024 after changing the arithmetic is forbidden.

## Alternatives considered

- **Require only a finite directly metered term.** Rejected by the demonstrated coherent masking
  exploit; direct metering prevents inference but does not constrain magnitude.
- **Bound drift as a fraction of surface exchange.** Rejected because the defect appears precisely
  when valid kinetic exchange becomes very small; the numerical bound must scale with field
  arithmetic, not surface physics.
- **Use an empirical multiple of the observed cold drift.** Rejected because one checkpoint is
  not a forward-error proof and would turn an evidence artifact into a numerical control.
- **Drop the drift term and loosen `divTol`.** Rejected by decisions 0006 and 0013: that weakens
  dual convergence and does not describe the actual float64 operator.
