# 0023 — Sum the opposing-vapor operands in ascending order (surface policy v6)

- **Date:** 2026-07-26
- **Status:** accepted
- **Charter impact:** none. No tolerance, fixture, or physical parameter moves. The noise-off
  symmetry check the Phase 2b gate enforced becomes enforceable again rather than being weakened.

## Context

Phase 6 WP0b opened on one calibration observation: at (−5 °C, σ∞ = 0.025, 48³, target extent
16) with noise off, `grow-lk` reported `symErr = 0.020915` where every sibling grid point
reported exactly 0. Noise-off runs must retain exact D6h symmetry — the symmetry metric is the
validity check applied to every Phase 6 run, so a condition that breaks it silently would
invalidate grid points without announcing itself.

Two things came out of reproducing it.

**It was not silent.** The same run line already published `deltaSymClean=false`, and the
periodic heartbeat printed `deltaSym=false` from step 78 onward. The solver announced the
break through the exact incremental check built for it. What dropped the announcement was the
WP0 calibration harness, which parsed only `symErr=` out of the terminal line. The defect is in
the solver; the silence was in a coordinator-only probe.

**The cause is float64 addition order, not physics.** Instrumenting the solver stage by stage,
the in-plane smoother output stays bitwise D6h-invariant. That is not luck: `solver-cpu/src/gg-solver.ts`
carries determinism decision 2, CANONICAL NEIGHBOR SUMMATION, which states the hazard exactly —

> Symmetric cells sum the same multiset of neighbor values in permuted order, and float addition
> is not associative — a fixed enumeration order makes ulp-level asymmetries possible at any
> preset […] Symmetric cells round identically, so the gate's "exactly 0" is structural, not luck.

— and discharges it by summing opposite-direction pairs, which map to pairs under every D6h
generator, then adding the three pair sums in sorted order.

**So the rule was already written down; the boundary operator simply never inherited it.** ADR
0009's aggregate boundary-pixel policy introduced a *second* neighborhood reduction two phases
later, and that one gathers in fixed direction order. It is the first array to break.
`opposingSigma` gathers its operands in a fixed lattice-direction order

```text
+i, -i, +j, -j, +i-j, -i+j, +k, -k
```

and accumulates `sum += input[opposite]` as it goes. A rot60 about the center maps
`+i → +j → -i+j → -i → -j → +i-j → +i`, which permutes those enumeration *positions* by the
cycle (1 3 6 2 4 5). That cycle is not order-preserving, so from three operands upward a cell
and its rotated image sum the same multiset in a different order — and float64 addition is not
associative. The captured instance, at growth step 14 of a 32³ run:

```text
cell (16,13,16)          image (19,13,16) = rot60(16,13,16)
  +i   <- 1.33997599709070429330e-2     -i   <- 1.33997599709070429330e-2
  +j   <- 1.52741366166647529051e-2     +j   <- 1.33997599709070429330e-2
  -i+j <- 1.33997599709070429330e-2     -i+j <- 1.52741366166647529051e-2
  mean = 1.40245521861596111890e-2      mean = 1.40245521861596129237e-2
```

Same operands bitwise; `(a + b) + a` against `(a + a) + b`; the results differ by one ulp. Re-
summing the image's operands in the source cell's direction order reproduces the source value
bit-for-bit, which is the decisive check — nothing else about the two cells differs.

That ulp enters `sigma_b`, then `alphaHK`, then the fill rate, then the accumulating fill
fraction `f`. Growth amplifies it. Eventually one member of a symmetry orbit crosses
`raw >= room` a step before its images, the attached set loses D6h invariance, and if the run's
size target fires while the orbit is split, the final metric reports the break.

**How often the field defect reaches the attached set was measured, not assumed.** The field
asymmetry is chronic: at 32³ the field loses exact D6h invariance at growth step 14, while the
attached set stays invariant through step 40. But re-running two v5 grid points that had
reported `symErr = 0` with the per-step delta captured — (−5 °C, f = 0.90) and (−10 °C,
f = 0.50), both 48³ — returned `deltaSymClean=true` for both. They were genuinely clean runs,
not lucky stops. Of three v5 grid points examined, one broke and two did not.

The lesson is therefore narrower and sharper than "v5 results are asymmetric": a v4/v5
`symErr = 0` is a snapshot at the stop instant and does not establish that the run stayed
symmetric, whereas `deltaSymClean` does. Under v6 both hold structurally and neither has to be
read as a probability.

The same defect is in the WGSL boundary kernel (`opposingSupersaturation`), where f32 makes one
ulp ~1.2e-7 relative rather than ~2.2e-16.

Fixing this in place was not available. Surface policy is checkpointed as a single value
precisely so numerics cannot be mixed across versions (ADR 0009), and v5 carries executed
Phase 2b evidence while v4 carries executed Phase 4b evidence.

## Decision

Add surface policy **`aggregate-hv-g1h1-v6`**. It is `aggregate-hv-g1h1-v5` in every respect —
the ADR 0009 classifier table, G_b = H_b = 1, the ADR 0013 float64 smoother-drift term in the
divergence identity, the ADR 0014 drift bound — with one change: the Eq. 5.35 opposing-vapor
mean sums its operands in **ascending value order**, by insertion sort over at most eight
values, before dividing by the count.

Ascending order makes the sum a function of the operand multiset alone. Because a symmetry
generator maps a cell's operand multiset onto its image's operand multiset with bitwise-equal
values whenever the input field is bitwise D6h-invariant, the boundary value is then exactly
equivariant; and because the smoother is already equivariant, invariance is preserved through
the whole relaxation-and-attachment cycle by induction from a symmetric seed.

This is gg-solver determinism decision 2 applied to the second reduction. It sorts values rather
than pairing directions only because the opposing mask is a variable subset of eight directions
with no pairing structure to exploit, where the smoother always has its three fixed pairs.

**Any future neighborhood reduction inherits this rule.** A reduction over a set that a D6h
generator permutes must be a function of the multiset — by pairing, by sorting, or by an
equivariant construction — and stating that here is the point of the ADR, because the same
omission has now happened once.

`legacy-v3`, `aggregate-hv-g1h1-v4` and `aggregate-hv-g1h1-v5` keep the gather-order sum
verbatim and are bit-unchanged.

**Phase 6 runs on v6.** Phase 2b and Phase 4b evidence stays on the policy that produced it.

**The WGSL lane is not ported.** `opposingSupersaturation` keeps the gather-order sum, and the
GPU LK entry points continue to refuse any policy but v5 — a refusal that predates this ADR and
is now worded to say why. So the shader defect described above is registered, not repaired. The
GPU is Phase 6's labelled diagnostic rather than its sweep engine, and this makes the operator a
second declared difference beside f32 arithmetic and the relaxed divergence tolerance: the GPU
lane can corroborate a trend, and cannot be compared value-for-value against a v6 sweep.

## Consequences

**Buys.** The noise-off symmetry check becomes a real check. Under v6, equivariance is
structural, so a noise-off run reporting `symErr = 0` *establishes* that it was symmetric —
where under v4/v5 the same reading established only the stop instant. The metric can therefore
be used to reject grid points. It also removes an arbitrary dependence of the answer on
array-enumeration order, which is the kind of arbitrariness the WP3 cross-platform control
exists to detect.

Measured on the configuration that opened WP0b, v6 gives `symErr = 0` and
`deltaSymClean = true` at the same stop step (88), the same extent (17) and the same aspect
ratio (0.605799) as v5's broken run, with attached count moving 765 → 749. The 16-cell
difference is not separately attributed here: v5's final state was 8 sites short of D6h closure,
and relating that deficit to the 16 was not measured.

**Costs.** A fourth surface policy to carry, and one more branch that a fifth policy could be
added to and miss — mitigated by routing the shared v5/v6 behaviour through
`metersSmootherDrift()` rather than repeating the string comparison at five sites. The
insertion sort adds work per boundary cell per sweep, and the policy flag is resolved once in the
constructor rather than per call so that the measured cost is the sort itself.

**Measured at about 5%.** Fixing the step count so both policies do identical work (48³, −10 °C,
σ∞ = 0.051, 40 growth steps, both ending at 189 attached) and alternating v5/v6 back to back so
machine drift falls on both equally, over three repeats:

| policy | runs (s) | min | median |
| --- | --- | --- | --- |
| v5 | 75.5, 78.1, 86.2 | 75.5 | 78.1 |
| v6 | 84.4, 79.2, 84.4 | 79.2 | 84.4 |

**+4.8% on the minimum, +8.1% on the median.** Note that the run-to-run spread *within* v5 is
75.5–86.2 s, about 14% — larger than the effect being measured. So ~5% is the right order and
the third digit is not available from this machine.

This is recorded because the first attempt at the number was wrong in an instructive way.
Differencing the v5 and v6 calibration matrices row by row gave apparent overheads of +3.3%,
+7.4%, +21.7% and +32.2% on rows whose trajectories were identical, and pushed one row over its
300 s budget. None of that is attributable: the two matrices ran ~40 minutes apart, two rows
overlapped with other processes, and the per-policy variance above swamps the signal. Comparing
separately-run matrices by wall time is not a measurement, and the four "results" it produced
were noise wearing a table's clothes.

The aspect ratio agreed here, but that is one grid point and not a guarantee: v6 will differ
from v5 wherever the split orbits fall differently, and any v5 calibration number carried
forward has to be re-measured rather than assumed.

**Forecloses.** Reading a v5 or v4 `symErr = 0` as evidence of symmetry. Comparing a v6 CPU
result bitwise against a v5 GPU result. Adding a policy that meters smoother drift without
also deciding its operand order.

## Alternatives considered

**Fix v5 in place.** Rejected. Phase 2b's accepted evidence was produced by v5 and Phase 4b's
by v4; changing either would make an old checkpoint claim a policy it did not run, which is the
exact failure ADR 0009 introduced the single policy value to prevent.

**Accept the ulp asymmetry and stop requiring exact zero.** Rejected. Symmetry under noise-off
is not a physical claim — real crystals are not perfectly symmetric — it is the project's
numerical-hygiene check, and a check with a tolerance wide enough to admit amplified roundoff
is wide enough to admit genuine defects. Weakening the instrument to fit the reading is the
wrong direction for a phase whose stated priority is accuracy.

**Compensated (Kahan/Neumaier) summation instead of sorting.** Rejected as insufficient. A
compensated sum is more accurate but still order-dependent, so it would shrink the asymmetry
without eliminating it, and "small but nonzero" is precisely the state the symmetry metric was
designed to refuse.

**Canonicalise by lattice geometry — sum in orbit-invariant direction order.** Rejected as
fragile. It requires the summation order to track the group action correctly for every cell,
including cells whose orbit is clipped by the domain, where the correct order is not defined.
Sorting by value needs no geometric argument.

**Symmetrise the field explicitly after each sweep.** Rejected. It would impose the answer
rather than compute it, and would mask any real asymmetry — including asymmetry from a genuine
bug, and the deliberate asymmetry of noise-on runs.
