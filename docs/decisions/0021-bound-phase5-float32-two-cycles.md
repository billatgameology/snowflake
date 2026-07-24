# 0021 — Bound exact Phase 5 float32 relaxation two-cycles

- **Date:** 2026-07-24
- **Status:** proposed; supersedes the WP4 residual-classification portion of protocol v4
- **Charter impact:** none; the float64 CPU oracle and aggregate-v5 physical/numerical contract
  remain unchanged, while Phase 5 still requires tolerance-bounded CPU-oracle agreement on the
  authenticated Windows D3D12 lane

## Context

Protocol v4 requires the GPU LK relaxation to satisfy the CPU oracle's configured
`residual < relaxTol` criterion exactly. Its pre-WGSL feasibility probe appeared to justify
that requirement: all nine local f32 samples reached zero residual. The probe first converged
the float64 CPU oracle at every interface step, however, and then rounded that already-converged
field to f32. It did not carry the evolving f32 field from one interface step to the next.

The production D3D12 implementation exposed the missing history case before any final WP4 or
Phase 5 evidence existed. In the frozen cold/noise/timeline fixture, steps 0–2 pass all field,
topology, source/exchange, drift, divergence, ledger, and decision checks. At step 3 the
unchanged-tick f32 operator becomes an exact period-two orbit in two interior cells:

```text
index 4419: 0.0018111496465280652 ↔ 0.001811149762943387
index 4743: 0.0017357079777866602 ↔ 0.0017357078613713384
```

Each change is exactly one local binary32 ULP. The reduced relative residual is
`5.82076573607537e-8`, the divergence residual is exactly zero, shell injection and surface
exchange are strictly positive, and the signed smoother drift is within its independent bound.
After 4,096 sweeps the active field repeats bit-for-bit every two sweeps, so the deterministic
operator cannot reach v4's configured `1e-9` residual.

This was not a compiler-contraction artifact. The implementation was changed to store each
shaped sum/product between stages and to evaluate division by seven with an integer,
correctly-rounded binary32 quotient. The two cycling cells then matched an independent
`Math.fround` replay exactly at both the in-plane result and final candidate. Independent
review reproduced the same orbit and rejected further arithmetic reshaping.

A bare residual floor would make unrelated slow drift eligible. Changing the CPU tolerance,
the aggregate-v5 equations, the fixture, or its noise seed after observing this result would
hide rather than solve the representability problem.

## Decision

1. `phase5-gpu-conformance-windows-v4` is superseded for final evidence by
   `phase5-gpu-conformance-windows-v5`. V4 remains immutable accepted design history and has no
   final WP4 evidence claim.
2. The configured CPU fixed-point branch remains unchanged:
   `residual < relaxTol`, plus the existing Dirichlet divergence criterion and smoother-drift
   bound where applicable.
3. A GPU f32 relaxation may alternatively report `bounded-two-cycle` only when all of these
   predicates pass on the same sweep:

   - at least two sweeps have executed under the current topology, tick, temperature, and
     far-field controls;
   - every active unattached destination value bit-equals its value two sweeps earlier;
   - every active unattached destination value is at most one ordered finite-f32 ULP from the
     immediately preceding value;
   - both orbit phases pass the unchanged Dirichlet divergence criterion when fixed-sigma
     Dirichlet is applicable; reflecting mode makes no divergence claim; and
   - both orbit phases pass the unchanged independently checked smoother-drift bound.

   The chosen state is the destination state from that deterministic accepted sweep. Its actual
   nonzero residual remains reported; it is never rewritten to zero or called a fixed point.
4. The GPU report records `fixed-point` versus `bounded-two-cycle`, the maximum current-step ULP
   distance, and the maximum two-sweeps-back ULP distance. The full-field equality and ULP
   metrics are produced by deterministic GPU reductions and independently reconstructed in
   the blocking evidence. ULP distance uses a monotone ordered-float key for finite binary32
   values, including negative supersaturation and signed zero; raw unsigned bit subtraction is
   forbidden.
5. The maximum allowed current-step distance is exactly one ULP and is part of the canonical
   tolerance manifest. Exact period two is mandatory; no decimal residual threshold, longer
   period, multi-ULP cycle, or generic stagnation test is accepted.
6. LK gains one f32 cycle-reference buffer. Its allocation rises from 60 to 64 bytes/cell,
   exactly the already frozen Phase 5 ceiling. The reference is comparison state only; it is
   not a new checkpoint field or resumable wire meaning. Reference validity resets after
   construction/import, every interface or topology update, every timeline event, and every
   other field mutation. The two-sweep reference, previous phase's applicable Dirichlet
   divergence result, and previous phase's smoother-drift-bound result remain valid across
   bounded submission-segment retries so segment boundaries cannot alter classification.
7. The evolving-f32 cold trajectory above becomes a mandatory regression. Mutations that accept
   a first-sweep stale reference, a nonperiodic one-ULP drift, period-three behavior, a two-ULP
   period-two orbit, one active-cell mismatch against the two-back state, residual-only
   Dirichlet convergence, or a cycle with either phase's failed divergence/drift must fail.
8. Fixture inputs, configured `relaxTol`, `divTol`, sweep caps, field/scalar tolerances,
   decision margins, physics, surface updates, CPU checkpoint meanings, and all non-LK criteria
   remain unchanged. Because the convergence evidence meaning and memory plan change, v5 gets
   new tolerance and aggregate protocol hashes and all final Phase 5 evidence must use them.

## Consequences

- **Buys:** a finite, exact, locally bounded termination meaning for an observed binary32 orbit
  without pretending that it is a fixed point or weakening the CPU oracle.
- **Costs:** one additional f32 cell buffer, extra comparison/reduction work per LK sweep, a new
  protocol identity, and a full replay of Phase 5 evidence.
- **Limits:** this is a Windows/Chromium/D3D12 f32 port rule, not a change to
  `aggregate-hv-g1h1-v5`, the float64 oracle, Phase 2b, or future validation. A backend producing
  a wider or longer cycle fails rather than inheriting this exception.
- **Forecloses:** silently raising `relaxTol`, accepting any small residual, tuning the frozen
  fixture away from the cycle, or reporting a bounded cycle as zero-residual convergence.

## Alternatives considered

- **Keep sweeping to the cap.** Rejected because a deterministic exact period-two state cannot
  escape without changing the operator.
- **Use a generic f32 residual floor.** Rejected because it can accept slow nonperiodic drift and
  does not prove representational stagnation.
- **Change the cold fixture, tick/noise timing, or seed.** Rejected as post-observation protocol
  tuning and because the CPU/GPU semantic inputs are already correct.
- **Perturb or damp the operator until it reaches a fixed point.** Rejected because that changes
  aggregate-v5 field arithmetic and can move attachment decisions.
- **Seed every GPU relaxation from a newly converged CPU field.** Rejected because it defeats GPU
  residency, is not the production trajectory, and merely recreates the flaw in the old shadow
  probe.
- **Accept longer or wider cycles.** Rejected without evidence or an error derivation. The only
  registered exception is an exact period-two orbit with at most one ULP of local motion.
