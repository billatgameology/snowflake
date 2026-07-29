# 0013 — Float64 smoother drift in the Dirichlet divergence identity

- **Date:** 2026-07-19
- **Status:** accepted; amends 0006 for the new `aggregate-hv-g1h1-v5` policy and is tightened by
  decision 0014's mandatory roundoff-scale bound. The executed `legacy-v3` and
  `aggregate-hv-g1h1-v4` meanings remain immutable.
- **Charter impact:** §2.4 and Phase 2b updated in this session (charter v1.10 → v1.11).

## Context

The registered Phase 2b v4 pair produced one valid warm result, then stopped the cold run while
attempting growth step 12. After 200,000 sweeps, the iterate residual was exactly zero but the
registered divergence ratio remained `3.097032516200489e-7`, above `divTol=1e-7`. The cold
checkpoint is the step-11 topology plus the attempted step-12 fixed-point field.

A retained independent probe, `scripts/diagnose-gate2b-v4.ts`, decoded that checkpoint and
reconstructed the certified reflecting stencil outside `LKSolver`. The exact input artifact is
15,041,088 bytes, SHA-256
`8997d90689fdbe6fb7fe496e4d2780d2f61abe92166e67ed56fa77e65f2de91d`.
One reconstructed sweep measured:

- 643,055 active cells, 39,764 Dirichlet-shell cells, 92 boundary pixels;
- maximum iterate change exactly zero;
- shell injection `3.679402302324622e-7`;
- signed boundary exchange `3.679401162802118e-7`;
- their difference `1.1395225041344048e-13` and ratio
  `3.097032516200489e-7`;
- signed field change created by the reflecting smoother before boundary replacement and shell
  clamp exactly `-1.1395225041344048e-13`.

Naïve, Neumaier-compensated, and exact binary-rational sums agree on every value. This is not a
global-summation defect. It is local IEEE-754 rounding in a mathematically conservative split
stencil. Including the independently reconstructed smoother change closes the actual floating
operator exactly:

```text
shell injection + smoother drift − boundary exchange = 0
```

The previous two-term identity assumes the reflecting smoother conserves exactly. That statement
is true over real arithmetic and to the Phase 2a mass tolerance, but false bit-for-bit. At very
small cold kinetic exchange, a harmless absolute drift of about `1e-13` is magnified above the
registered relative tolerance. More sweeps cannot move a floating-point fixed point.

## Decision

1. Fixed-sigma Dirichlet convergence remains dual. `relaxTol`, `divTol`, and
   `relaxMaxSweeps` retain their meanings and registered values. Residual-only acceptance remains
   forbidden.
2. The new `aggregate-hv-g1h1-v5` policy keeps v4 classification, Eq. 5.34 boundary values,
   `G_b = H_b = 1`, fill, ledger, noise, and interface timing bit-for-bit. Its only numerical
   change is the divergence identity for the actual float64 split sweep:

   ```text
   divergenceResidual =
     abs(shellInjection + smootherDrift - surfaceExchange)
     / max(abs(surfaceExchange), 1e-300)
   ```

   `smootherDrift` is the signed sum, over active unattached cells, of the reflecting-smoother
   candidate minus the sweep input **before** boundary replacement and Dirichlet clamping.
3. The drift must be metered directly from those two field states during the same sweep. It may
   not be inferred from shell injection, surface exchange, or the final field change; such an
   inferred correction would make the identity tautological. The report exposes the finite signed
   value as `smootherDriftDiagnostic` so evidence validators can recompute the three-term ratio.
4. Exact arithmetic has `smootherDrift = 0`, so the v5 identity reduces to decision 0006's
   original identity. The drift is a numerical diagnostic only: not vapor, uptake, a reservoir
   term, or permission to hide a physical imbalance.
5. `legacy-v3` and `aggregate-hv-g1h1-v4` retain the original two-term identity and report no
   smoother-drift term. Phase 4's completed v4 artifacts and checkpoint meanings remain frozen.
   Phase 2b v5 must explicitly name the new policy and distinct output files.

## Consequences

- The cold fixed point can be judged by the actual discrete float64 operator without loosening
  `divTol`, increasing the cap, or discarding the divergence guard.
- The added term costs one deterministic signed accumulation per active cell per v5 aggregate
  sweep. It does not alter field values, topology, fill, physical time, or the permanent G-G
  control.
- A nonstationary field still fails: after accounting for the independently metered smoother
  drift, the remaining numerator is the global final-sweep field change. The iterate max norm and
  this global balance therefore remain independent, load-bearing criteria.
- V5 needs adversarial tests for a real float64 floor, a residual-only negative control, a forged
  or missing drift term, v4 bit preservation, and external checkpoint reconstruction before any
  morphology execution.

## Alternatives considered

- **Loosen `divTol`, add an absolute floor, or increase `relaxMaxSweeps`.** Rejected: the first
  two weaken frozen convergence semantics; the last cannot move an exact floating-point fixed
  point.
- **Accept zero iterate residual alone.** Rejected: this restores the measured divergence-blind
  defect closed by decision 0006.
- **Use compensated summation for shell and exchange totals.** Rejected by evidence: naïve,
  compensated, and exact sums reproduce the same mismatch.
- **Change the certified diffusion stencil to force bitwise conservation.** Rejected: that would
  alter the permanent oracle kernel and every morphology field, while the defect is confined to
  accounting for its existing `~1e-13` numerical drift.
- **Infer drift as `surfaceExchange - shellInjection`.** Rejected: it would force every reported
  divergence to zero by construction and destroy the guard.
- **Apply v5 semantics retroactively to v4.** Rejected: executed policies and evidence retain the
  meanings under which they ran.
