# Cold spatial and growth-stage follow-up

The earlier -18 C / .10 null is specific to its selected observation stage. The saved
trajectory already contains a prism-associated gap contrast at other stages. The -14.4 C
contrast is larger at later shared tip stages, but is also stage-dependent. These are internal
discrete-model observations, not a temperature threshold, resolved length scale or new law.

`cold.json` reads all eight named rows at -14.4/-18 C, fraction .10, in the four existing facet
arms. The script records hashes of their specs, results, event logs and all 32 spatial snapshots.
It reads immutable retained inputs and writes one new output. Reproduce from the repository:

```powershell
$env:BLD_REVIEW_INPUT = 'C:/Users/biao3/Documents/GitHub/snowflake/out/hil-retired-2026-10-08/hil-bld-results-integration/restores/bld-first-batch-output-2026-10-08/batch1-bld-resumable'
$env:COLD_FOLLOWUP_OUTPUT = 'out/cold-followup-rerun'
node evidence/hil-bld-joint-review-2026-10-08/followup/cold.mjs
```

## Growth-stage comparison

Core retains the earlier definition: largest fully occupied integer hex ball in the central
plane. Tip is maximum central-plane hex radius; their difference is a lattice-cell gap, not
an exact Euclidean radial length. The table samples half the shortest retained plateau duration
at each exact common tip, measured in seconds since each row first reached that tip. It does
not compare equal absolute ages. Full event brackets, quarter/three-quarter samples and
absolute-age selections remain in `groups`.

| Tip radius, cells | -14.4 C gaps: neither / basal-only / prism-only / both | -18 C gaps, same order |
|---|---|---|
| 3 | 1 / 1 / 1 / 1 | 1 / 1 / 1 / 1 |
| 4 | 1 / 1 / 1 / 1 | 0 / 0 / 1 / 1 |
| 5 | 1 / 1 / 1 / 1 | 1 / 1 / 1 / 1 |
| 6 | 1 / 1 / 1 / 1 | 0 / 0 / 1 / 1 |
| 7 | 1 / 1 / 2 / 2 | 1 / 1 / 1 / 1 |
| 8 | 0 / 0 / 2 / 2 | No common positive-duration plateau |

At -18 C, the tip-4 and tip-6 half-plateau elapsed times are respectively
0.7334458397 and 0.9577161489 s. Both contrasts also hold at the next recorded event in each
time bracket. At tip 4 the contrast disappears by the three-quarter sample: all four gaps
are zero. At tip 6 it remains at that sample. The former tip-7 null remains true at all four
sampled fractions (0, .25, .5, .75); it is not an absence of intervention effects throughout
the trajectory. At -14.4 C, the tip-6 contrast is present at entry/quarter, absent at half,
and present again at three-quarter as different arms' complete cores catch up in discrete steps.
Tip 7 retains the 1/1/2/2 pattern at all four samples.

Absolute-age observations answer a different question. At the shortest terminal ages,
7.9889614307 s (-14.4 C) and 12.1014084261 s (-18 C), the control arms have central-plane tip
radius 4 while the prism-only/both arms have 10/9. The matched-tip comparisons therefore
remove a large size difference while retaining unequal physical ages and different surrounding
three-dimensional shapes. They do not isolate fixed-geometry transport.

## What the saved fields can and cannot resolve

At the initial identical 19-site seed, each row has 12 prism boundary cells. The prism-only /
neither mean cellwise `alphaHKBoundary * sigmaBoundary` ratios are 4.1589446416 at -14.4 C and
4.3871451515 at -18 C. The corresponding both / basal-only ratios are 4.1764799850 and
4.3916969822. Thus the later -18 C selected null is not explained by an absent initial prism
response. These dimensionless demand factors are not deposited growth or physical uptake.
The first solve also precedes the first lagged monopole-demand feedback; it is not a mature-field
measurement. Initial ratios do not establish which later process produces the radial gap.

The later snapshots are sparse and tied to extent crossings. In both prism-enabled -14.4 C
rows, there are **zero prism-class cells in all three saved post-initial snapshots** (extents
9, 13 and 17). The central-plane boundary then consists of inhibited/rough cells; it cannot
supply a prism core/rim field ratio. This does not mean prism kinetics stopped acting during
growth: independent occupancy reconstruction finds prism-class cells before 177 of 229
updates in each row. At -18 C, both prism-enabled rows have 0, 12 and 72 prism boundary cells
in those three snapshots, with respectively 0, 12 and 24 in the central plane. The distribution
is retained by radial ring and axial plane in `rows[].snapshots`.

These observations show changing facet membership and explain why averaging only the available
prism fields would sample different surfaces across temperatures and stages. For example,
the -14.4 C both-arm extent-17 snapshot is at 5.5077232848 s with central tip 8; its neither
comparator is at 26.6686104565 s with central tip 7. No temporal precursor or spatial-causality
claim is supported by treating that pair as a matched field comparison. The basal center/rim
profiler was not used as a prism mechanism metric.

## Decision implication and checks

Keep -18 C as a comparison of stage-dependent core catch-up, rather than labeling the whole
condition a null. The next useful cold experiment would discriminate sustained separation
from cell-scale catch-up using matched tip stages over a longer common radial window and/or
physically matched refinement. A next run should retain fields near the actual prism-bearing
states identified by the events; the existing four extent snapshots miss much of that activity.
This is a recommendation for discussion, not a frozen roster or authorization to add a
prism-width rule. More temperature points alone would not resolve this ambiguity.

Codex/GPT-6 performed this analysis with shared parent context. Every saved attachment count,
uniqueness and terminal count/time was checked. Ring-based core radii were independently
recomputed from explicit site membership. Every event's pre-update boundary/prism count was
reconstructed; all snapshot boundary indices, neighbor counts, prism memberships, cycle/time
bindings and radial censuses reconcile. The executed script completed on Node v24.13.1.
An initial invocation failed on an over-deep relative import before reading inputs; the corrected
script is the retained producer. No simulation or checkpoint continuation ran. This is an author
calculation, not an independent review or full-suite claim; parent verification is recorded separately.
