# 0019 — Compare the G-G Dirichlet corrected-mass invariant

- **Date:** 2026-07-24
- **Status:** accepted
- **Charter impact:** none; Phase 5 still requires CPU-oracle agreement at frozen tolerances

## Context

Windows D3D12 WP3 execution exposed an unregistered comparison seam before any canonical WP3
evidence existed. Both complete frozen G-G fixtures preserved exact occupancy, boundary order,
events, noise bits, and stop reason. Their `b` and `d` fields and total mass passed the frozen
field and mixed-scalar bounds. The Dirichlet fixture nevertheless differed from the CPU
oracle's accumulated shell meter by `0.024480659606307853`, above the generic mixed-scalar
limit `0.004255350462365598`.

That scalar is a signed, cancellation-heavy sum over the shell of two already-different
binary64/binary32 trajectories. Individual cycle sums can be close to zero, so permitted
per-cell field differences are amplified rather than averaged. The WP0 float32 shadow did not
pre-register this meter comparison; it covered G-G fields, occupancy, and decision margin.
Applying the generic scalar envelope directly to the two meters therefore adds a stricter
aggregate field condition that was neither derived nor shown feasible before implementation.

The production reduction itself is not the source of the discrepancy. A real D3D12 witness
fed two synthetic full-cell delta fields through the production 256-lane tree and persistent
accumulator. Both reduced values and their binary32 accumulated value matched an independent
operation-rounded calculation exactly. Changing the surface transfer equations to locally
conservative alternatives did not materially change the cross-precision meter difference and
would have changed the specified G-G operation order, so that experiment was reverted.

The active handoff states that any criterion or evidence-meaning change requires an ADR and
invalidates the Windows v2 bundle. Continuing under v2 by silently making the failed meter
diagnostic non-blocking would violate `NC-TOLERANCE-BYPASS`.

## Decision

- `phase5-gpu-conformance-windows-v2` is superseded for final evidence by a Windows v3 protocol
  frozen before canonical WP3 execution. The v2 record remains immutable development history;
  it never produced a final Phase 5 gate.
- V3 keeps the exact Windows lane, pinned runtime, fixtures, numerical field/scalar tolerances,
  decision margins, performance thresholds, and scientific meanings. Only the G-G Dirichlet
  ledger criterion, its explicit manifest policy, the tolerance-bypass wording, protocol ID,
  and derived protocol hash change.
- A Dirichlet G-G fixture passes its ledger comparison only when all of these hold:
  1. final `b`, `d`, and total `Σ(b+d)` independently pass their existing CPU-oracle bounds;
  2. real-device witnesses independently verify the complete clamp-delta generation
     (`rho - destination` on exactly the topology-bit-0 set), deterministic reduction, and
     persistent binary32 accumulation. Positive and negative clamp signs are both exercised,
     and wrong-sign, wrong-mask, one-omitted-delta, and scaled-delta mutations must all reject;
  3. CPU and GPU conservation comparisons each check their own
     `Σ(b+d)_final - dirichletMeter` against their independently reconstructed initial mass,
     using the unchanged mixed-scalar bound on the extensive invariant; and
  4. the corrected-mass invariant
     `Σ(b+d)_final - dirichletMeter` agrees between CPU and GPU under the unchanged mixed-scalar
     bound.
- Direct CPU-vs-GPU comparisons of each signed clamp delta and the accumulated meter remain
  mandatory report fields, including their ordinary mixed-scalar result, but are explicitly
  diagnostic. They may not be described as equal when they are not.
- `NC-TOLERANCE-BYPASS` rejects bypass of any **blocking** raw field, scalar, decision, or
  invariant comparison. A diagnostic failure named by this decision is not a bypass.
- WP1 and WP2 implementation results remain usable, but their v2 canonical records do not prove
  v3 protocol identity. Required canonical probes are rerun under v3 before final publication.

## Consequences

**Buys.** The gate tests the actual ledger claim: after removing the metered reservoir source,
mass is invariant within each precision lane and agrees across them. Clamp selection/sign,
deterministic reduction, and accumulation have exact independent witnesses, while final fields
and total mass remain independently compared. No numerical tolerance is widened and no CPU or
GPU solver arithmetic is changed.

**Costs.** Phase 5 no longer claims that a cancellation-heavy signed shell meter itself agrees
between binary64 and binary32 within the generic scalar envelope. The measured direct
difference remains visible in every report. Earlier v2 probes must be replayed because their
protocol identity is superseded.

**Forecloses.** Quietly treating the direct meter failure as a pass under v2, omitting it from
the report, using a host-side CPU mirror as the GPU meter, or enlarging the generic scalar
tolerance to absorb this one aggregate.

## Alternatives considered

**Widen the scalar tolerance.** Rejected. It would weaken unrelated physical-time, kinetic, and
ledger quantities and would tune a frozen envelope to production output.

**Keep v2 and call the meter comparison diagnostic.** Rejected. That changes a registered
criterion and defeats the v2 tolerance-bypass negative without the required authority record.

**Copy the CPU meter into GPU evidence.** Rejected. It would cease to meter the executed GPU
field and would require a forbidden host-resident oracle mirror.

**Read back and sum the shell on the host every cycle.** Rejected. It defeats GPU residency and
still sums a different binary32 trajectory; it does not solve the cross-precision condition.

**Change freezing or melting to force local binary32 conservation.** Rejected after a measured
experiment did not close the meter gap. It also changes the specified G-G operations merely to
improve a comparison.
