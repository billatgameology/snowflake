# Warm switch-state triage — November 11, 2026

The saved events already localize a concrete structural fork: width 4 fills two central
patches before the 5 s cutoff, while width 3 leaves them unoccupied. This is a candidate
explanation for the different later openings, not proof that geometry alone carries memory.
Vapor, partial fill, attachment history and geometry remain coupled in these comparisons.

## Six-row scope and exact switch geometry

Selected BLD rows: at -4.5 and -5 C, CFL .025, early1-width3, early5-width3 and early5-width4.
All six recorded size endpoints pass the existing checker. The recipe reconstructs occupancy
from the 19-site seed and every attachment, verifies coordinates/counts, and uses the existing
cavity geometry definition. Row specs, events, results and boundary samples are hash-bound.
This is a post-hoc mechanism analysis of registered experiments, not a newly registered gate.

The table is identical at both temperatures:

| Preparation | Sites at actual switch | Occupied central-axis layers | Full-probe waist thickness | Maximum positive-depth opening |
|---|---:|---|---:|---:|
| Early 1 s, width 3 | 19 | z = 0 | .35 um | 0 |
| Early 5 s, width 3 | 109 | z = 0 | .35 um | .35 um |
| Early 5 s, width 4 | 123 | z = -1, 0, +1 | 1.05 um | 0 |

Both early5 cases have the same axial span 1.4 um and lateral lattice-coordinate span 2.1 um.
Width4 contains all width3 switch occupancy plus exactly 14 sites: a radius-1 seven-site hex
patch in each z=-1 and z=+1 plane. There is no width3-only occupied site at these switches.
The signed layers are not independent crystals/cavities. A zero positive depth does not mean
there are no open outermost planes; it means no opening extends below the axial envelope.

Their actual cutoff ages differ slightly: width3/width4 are
5.021064751997452 / 5.026772717363253 s at -4.5 C and
5.017293754009521 / 5.024371940920387 s at -5 C.
A separate post-hoc common-age check at 5.05 s preserves the same 109/123 site and .35/0 um
depth contrast in both at-or-before and next-event alternatives. Early1 then has 111 sites
and zero positive opening depth at both temperatures and both alternatives. Thus the
observed width3/width4 structural difference is not an artifact of their slightly different
switch observation ages. This is not an assertion that every possible intervening metric
or field is equal at either bracket.

## Where the two histories diverge

In width4, the twelve ring sites in those two central patches attach at
2.4550216290292517 s (-4.5 C) / 2.312863911073845 s (-5 C). The two axis centers attach next,
at 2.500416126058739 / 2.3563336846994494 s. This localizes a useful capture interval near
2.3-2.5 s, before the 5 s cutoff, as well as at the cutoff itself.

Early1 switches before any site attaches: actual switches are 1.0338799885228636 and
1.0328772117737612 s. Its first attachments occur later at 2.6667585447484012 and
2.425338964994586 s. The switch still carries partial-fill and vapor history, so unchanged
binary geometry is not equivalent to an unchanged complete state.

Before early5 cutoff, recorded selected kinetic demand is 64.74040216304859 / 78.21174802957563
fill units for width3/width4 at -4.5 C and 66.97727673964856 / 80.98605750486011 at -5 C.
Width4 receives more, yet central filling rather than deeper opening distinguishes its
geometry. These are summed kinetic demand diagnostics, not deposited mass or physical uptake.
At the final active update both widths have the same basal-width histogram (24 width-1 and
two width-3 cells), so the distinction is already embodied in their earlier evolving states;
the late histogram alone misses it. Selected demand is zero after each switch.

## Later spatial witnesses, with explicit unequal ages

At the first later extent-9 snapshot, width3's axis boundary remains at z=+/-1; width4's has
advanced to z=+/-3. These are different states and slightly different times, not an isolated
same-state field comparison:

| Temperature | Width | Snapshot age (s) | Axis fill | Axis solved sigmaBoundary | Axis alphaHKBoundary |
|---|---:|---:|---:|---:|---:|
| -4.5 C | 3 | 7.2809576307613115 | .5755068476213967 | 4.1064417426571856e-5 | 7.309073597367201e-62 |
| -4.5 C | 4 | 7.257675843878523 | .22119970037305794 | .0010438259247056829 | .0039344719051230045 |
| -5 C | 3 | 7.422305748007743 | .5784545733091957 | 5.018820695924253e-5 | 1.2762552732842145e-55 |
| -5 C | 4 | 7.467178625855335 | .15104303852346396 | .0013983551421974253 | .010710343149502408 |

At the next extent-13 sample, width3's same axis fill values are unchanged in the saved
binary64 records; its axis solved supersaturation is the minimum positive subnormal 5e-324
and recorded attachment coefficient is zero. Width4's axis boundary has advanced to z=+/-5.
These observations are consistent with strong local suppression inside the prepared opening,
but do not independently identify a transport/geometry/fill cause or establish a physical
zero flux. The detailed record includes first-inactive-update aggregate facet diagnostics,
which are already different before the first later spatial snapshot.

Boundary records are after converged relaxation and before surface advance; event attachments
and reconstructed occupancy are after surface advance. The recipe keeps these timings separate.
There is no exact-switch spatial snapshot in any of these six cases; the preceding spatial
sample is age zero. We have reconstructed exact binary geometry, not invented missing maps.

## Implication and next discriminating work

The useful hypothesis is more specific now: filling or leaving open the central z=+/-1
patches before cutoff may steer later growth into different patterns, with subsequent local
vapor/kinetic suppression reinforcing an unfilled floor. This is an association between
coupled states, not geometry-only causality. A short deterministic prefix replay that captures
full state before/after the central-patch attachments and before/after cutoff could recover
the missing spatial evidence cheaply relative to rerunning complete long endpoints. It must
verify agreement with the original event prefix before its recovered state is used.

Do not infer a necessary duration threshold from just early1/early5, or a physical width law
from widths3/4. Future controlled state interventions need their own authorized contract.

## Reproduction and custody

From primary root with locked dependencies:

```powershell
node out/warm-switch-analysis-2026-11-11/analyze.mjs
```

The same recipe works under evidence/<bundle>/analyze.mjs at the same directory depth.
Argument 1 optionally sets the BLD rows root; argument 2 sets the output directory. Executed
analysis exited zero and stderr is empty. summary.json is concise; readout.json retains all
boundary-profile summaries; inputs.json retains the exact source byte bindings. None of this
lane's output has been NAS-published. No solver change or simulation was performed here.
Author is a shared-context Codex analysis agent; no independent scientific validation or
external physical evidence was consulted. Parent verification owns the final check record.
