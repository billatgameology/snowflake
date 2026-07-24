# 0020 — Floor the Phase 5 float32 smoother-drift bound at one subnormal ULP

- **Date:** 2026-07-24
- **Status:** accepted; amends the pre-WGSL WP4 numerical contract
- **Charter impact:** none; Phase 5 still requires CPU-oracle agreement at pre-registered field
  and scalar tolerances on the authenticated Windows D3D12 lane

## Context

Phase 5 protocol v3 pre-registered the aggregate-v5 GPU smoother-drift limit as

```text
64 * activeCellCount * 2^-23 * maxAbsSweepInput
```

with an exact-zero-field special case. The factor covers the split smoother and the fixed
256-lane recursive reduction. Before any production LK shader existed, independent WP4 review
found that this relative expression underflows conceptually at legal nonzero binary32
subnormals. For `maxAbsSweepInput = 2^-149`, even 1,000 cells produce a bound below one minimum
binary32 ULP. A legitimate one-ULP directly metered drift could therefore fail, or an f32 shader
calculation of the bound could underflow to zero.

This is the same numerical-domain defect closed for the CPU float64 oracle by decision 0014.
The CPU and checkpoint contracts accept finite active supersaturation down to binary subnormals;
silently narrowing the GPU input domain would make the port less general than its oracle.

No Phase 5 final evidence exists. The registered blocking fixtures use normal-scale
`sigmaInfinity = 0.002`, so the missing floor does not change any measured normal-field
envelope or excuse a production mismatch. It changes a load-bearing tolerance manifest and
therefore requires a new protocol identity rather than an in-place edit to v3.

## Decision

1. `phase5-gpu-conformance-windows-v3` is superseded for final evidence by
   `phase5-gpu-conformance-windows-v4`. V3 remains immutable WP3 development evidence.
2. The binary32 smoother-drift bound is:

   ```text
   perCellRoundoffScale = max(2^-23 * maxAbsSweepInput, 2^-149)
   smootherDriftAbsLimit = 64 * activeCellCount * perCellRoundoffScale
   ```

   An exact zero field remains special-cased to a zero bound and zero drift.
3. The bound is computed in host binary64 from the independently reduced binary32
   `maxAbsSweepInput`; WGSL never evaluates the potentially underflowing product. The field,
   drift, and reduction remain binary32.
4. `2^-149` is part of the canonical tolerance manifest and is pinned by an adversarial
   subnormal test. A non-finite drift or a magnitude above the independently computed bound is
   still a solver failure.
5. Fixture definitions, field/scalar tolerances, decision margins, positive-source guards,
   performance budgets, and every non-LK criterion remain unchanged. WP1–WP3 implementation
   closures remain valid, but their canonical probes must replay under v4 identity before final
   WP7 publication.

## Consequences

- **Buys:** the GPU drift guard covers the complete finite binary32 input domain already accepted
  by the port, including subnormals, without weakening normal-field conformance.
- **Costs:** the tolerance and aggregate protocol hashes change; v3 probe logs cannot establish
  v4 identity and must be replayed before the final gate.
- **Limits:** the factor remains specific to the frozen split smoother and 256-lane recursive
  reduction. A different arithmetic/reduction composition requires a new derivation and
  protocol.
- **Forecloses:** evaluating the bound in WGSL f32, rejecting subnormal input only on the GPU,
  treating a finite-but-over-bound drift as convergence evidence, or silently rewriting v3.

## Alternatives considered

- **Keep the relative-only expression.** Rejected because it is below one representable ULP on
  legal subnormal inputs.
- **Reject or flush subnormal sigma.** Rejected because the CPU/checkpoint contract accepts it
  and no scientific or numerical authority permits the GPU port to narrow the domain.
- **Use the CPU float64 floor or factor.** Rejected because binary32 has a different minimum ULP
  and the GPU reduction has its own operation-count factor.
- **Call this an implementation detail under v3.** Rejected because the floor is a load-bearing
  tolerance-manifest value. Protocol identity must expose it.
