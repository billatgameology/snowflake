# HIL completed-batch triage, 2026-10-08

Internal exploratory model-development review by Codex/GPT-6, with shared context. No new simulation,
physical validation, grid/domain-independence claim or new-run commitment. The analysis reconstructs
occupancy from the canonical seed and every recorded attached-site event, rechecks operational
coverage with the existing checker, and compares physical-age brackets with the existing
`bracketCavityTime`. It checks all 72 rows (24 seed, 32 pressure, 16 environment history), including
the six recovered first-batch rows. Every event's attached count, maximum lattice extent and
Cartesian aspect ratio agrees exactly with its reconstructed occupancy; all 72 rows pass the
existing size-endpoint checks, with recorded D6h and convergence checks passing.

Canonical report: `analysis-v2.json`, SHA-256
`037d3e203bcc48ae3e44dbb2a759ba06bca6b943bec35127aecc2264e36fd194`.
Its `sources` inventory binds every inspected spec/result/exit/event/spatial file. `analysis.json`
is the superseded first draft: its static-control selection used the wrong track name and omitted
those four rows from history comparisons. The corrected v2 report includes them. The original
draft is retained only as rejected analysis, never as the current result.

## Seed response: opposing facet effects, with an age-dependent transition

Aspect ratio means inclusive axial span divided by the largest Cartesian lateral span, both in
the project's cell convention. Maximum target extent 21 instead uses i/j/k lattice spans. The
wide seed has 37 sites (radius 3, thickness 1), the tall seed 35 (radius 1, thickness 5): near-volume
matching does not isolate shape from every initialization difference.

The entries below are **both-minus-neither aspect-ratio differences**, not physical habit labels.
Each quartet common age is the shortest terminal age among its four arms; those ages differ
between rows in this table. All exact bracketing event times and the following events are in
`seeds[].commonAge`.

| Temperature (C) | Seed radius/thickness | Size-21 endpoint difference | Quartet common age (s) | Difference at that age |
|---|---|---:|---:|---:|
| -7 | 3/1 | +0.210526 | 11.811190 | +0.073099 |
| -8 | 3/1 | -0.105263 | 10.444710 | +0.049536 |
| -9 | 3/1 | -0.210526 | 8.881102 | -0.126316 |
| -7 | 1/5 | +0.394737 | 10.345232 | +0.293844 |
| -8 | 1/5 | 0 | 11.522353 | +0.052381 |
| -9 | 1/5 | -0.235294 | 12.349546 | -0.133333 |

At these six quartet ages, basal-only minus neither is positive, prism-only minus neither negative,
and the factorial interaction (both - basal-only - prism-only + neither) negative. This identifies
opposing and coupled contributions in this implementation over the measured comparisons. It does
not identify a unique temperature crossover or a temperature-independent facet effect.

At -8 C the wide seed's both-minus-neither difference becomes -0.032164 at the later pair-specific
common age 11.687289234922202 s. The neither observation is bracketed by
11.67217550604954 / 11.705013959429051 s, with aspect ratio 0.6111111111111112 on both records;
the both arm is at its terminal 0.5789473684210527. This differs from the positive earlier
four-arm-age contrast. For the tall seed at the pair age 13.825224386595027 s, the at-or-before
contrast is +0.101961, but the next neither event changes its aspect ratio from 1.1333333333333333
to 1.2666666666666666. The bracket is 13.804540209056546 / 13.904543787196664 s. This discrete
jump is retained; there is no interpolation or claim of a robust continuous sign at that age.

The -8 C endpoint tie for the tall seed and negative wide-seed endpoint are therefore useful
signals of age/geometry dependence, not a sharply localized material transition. The full quartet
and first-crossing results at extents 9/13/17/21 are in `seeds`.

## Pressure: growth time and occupancy remain informative when endpoint shape ties

All rows here use -6 C, radius 2 / thickness 1. Fractions are fractions of the project water-line
supersaturation table. The table shows the both-dip arm at size 21; count is attached occupancy,
not total accreted mass or kinetic demand.

| Fraction | Pressure (Pa) | Endpoint aspect ratio | Attached sites | Physical time to extent 21 (s) |
|---|---:|---:|---:|---:|
| .10 | 50662.5 | 1.235294 | 3759 | 13.566573 |
| .10 | 101325 | 1.235294 | 3883 | 25.190106 |
| .10 | 202650 | 1.166667 | 4229 | 48.561345 |
| .20 | 50662.5 | 1.000000 | 3607 | 5.783881 |
| .20 | 101325 | 1.000000 | 3317 | 10.215326 |
| .20 | 202650 | 1.000000 | 2787 | 18.169637 |

At fraction .20 all three terminal i/j/axial spans are 21/21/19 cells, yet occupancy falls with
pressure. At fraction .10 the high-pressure terminal has i/j/axial spans 19/19/21 rather than
17/17/21 at the lower two pressures; do not ascribe its increased count solely to compactness.

At common physical age 13.566573307401567 s for the fraction-.10 triplet, the aspect ratios are
1.235294/1/0.9 and extents 21/13/11. The 1-atm bracket is
13.515231696523017 / 13.569289171310817 s; the 2-atm bracket is
13.501093758842972 / 13.588791467392307 s. This explicitly separates unequal progress in time
from endpoint comparison. At fraction .20 the analogous common age 5.783881122200879 s yields
aspect ratios 1/0.928571/0.9.

The .10 and .20 neither/prism-only rows all end at aspect ratio 0.578947 within each arm across
the three pressures; the .20 basal-only rows all end at 1.105263. Those ties do not make pressure
irrelevant. `pressure` retains every arm's times, counts, shape spans and actual common-age
brackets; `pressureQuartets` retains matched four-arm effects at each forcing/pressure.
Fraction .15 has the original 0.5/2-atm pairs only; no missing 1-atm result is imputed.

The saved pre-update extent-17 observations also change consistently in the named both-dip
triplets. For .20, mean basal boundary supersaturation is 0.002560723/0.001822053/0.001459813,
and mean cellwise basal alphaHK times boundary supersaturation is
0.001060942/0.000540121/0.000313422. These are diagnostic observations of evolving, differently
shaped boundaries at different ages, not a controlled fixed-geometry transport experiment or
deposited mass. Raw snapshot identities and all facet means are in `inventory[].snapshots`.

## Environmental history: switch timing survives into later shape

All twelve events actually fired. Endpoint aspect ratios for switch extents 7/11/15:

| Direction (C) | Preparation | Endpoint aspect ratios (7 / 11 / 15) | Common seconds after each actual event | At-or-before aspect ratios at that elapsed time |
|---|---|---|---:|---|
| -6 to -14.4 | M1 | .382085 / .600420 / .818755 | 3.454654 | .380971 / .600000 / .818755 |
| -6 to -14.4 | no-dip | 1.105263 / .894737 / .789474 | 10.754833 | .866667 / .764706 / .789474 |
| -14.4 to -6 | M1 | .894737 / .684211 / .473684 | 6.596894 | .838136 / .562500 / .473684 |
| -14.4 to -6 | no-dip | .684211 / .789474 / .894737 | 9.372577 | .562500 / .764706 / .894737 |

Later switching retains more of the starting-environment geometry at the size-21 stop in these
endpoint sequences. The no-dip cooling sequence is not monotonic at the named common elapsed
time, so endpoint ordering is not a universal time-ordering result. The M1 histories differ at
the common post-event age in both directions; this supports a finite growth-history lead in the
implementation. Initial geometry and elapsed prehistory deliberately differ across switch stages.
It does not show that memory persists indefinitely or that an environment return loop has hysteresis.

Static size-21 controls are M1: -6 C aspect ratio 1 and -14.4 C 0.272918; no-dip: -6 C 0.578947
and -14.4 C 1.105263. The common absolute age including static controls can precede a late switch
(M1 cooling at 5.776211 s is before the extent-15 event at 7.677196 s), so that comparison must
not be labeled a completed post-switch comparison. `history` retains actual event times,
event geometry, elapsed durations, every bracket and the static controls.

## Next options for discussion

1. **HIL priority: test persistence of the seed/facet transition over growth, with targeted numerical
   qualification.** The -8 C midpoint found an age-sensitive response, so another tiny temperature
   increment is less informative than separating transient seed memory from a persistent response
   at explicitly matched physical times and lateral/axial sizes. Reuse all flanks and mixed-arm data.
   Select the smallest set of longer or changed-resolution controls that can distinguish those
   explanations, then freeze targets and adequate domain/capacity before execution. Existing
   terminal resume bindings do not authorize increasing their targets in place.
2. **Parallel pressure option:** investigate occupancy/geometry at .20, where equal outer spans
   coexist with decreasing occupancy, and .10 as its qualitatively different comparator. Begin by
   extracting existing interior/plane profiles before adding pressure levels. A selected timestep
   or grid control has more decision value than filling the unmeasured .15 midpoint merely for
   completeness. The current data already establish a growth-rate difference within the model.
3. **Environment-history option:** longer post-switch observations for early/late switch pairs
   would distinguish decay toward static behavior from sustained history dependence. A return
   loop is interesting later, but requires a new multi-event runner contract and cannot yet be
   interpreted as justified by these one-switch endpoints. Keep ordinary timelines separate from
   experimental facet/width arms.

These are options, not a registered roster or launch authorization. The warm/cold BLD findings
should set the final joint priority. N64 / dx .35 um / maximum extent 21 remains a short early-growth
window; largest center span is 7 um. This review did not audit field/checkpoint bytes, rerun a
solver, establish trajectory equivalence across computers, or perform an independent review.

## Source comparability and rerun

HIL producers are b9cf7ed72c82e350b93570fafd8e45afa0b95d53 and
43228078308cc089b9da8c6240975b267d7d74cb, both Node v24.13.1. Their numerical core, solver and
`post-phase10-discovery.ts` bytes are unchanged. The inspected source diff adds bounded publication
rename retries and the finite second-batch roster/dispatch seam. No scientific evolution change
was found in that diff. Current analysis helpers/core/solver also match the second producer.
This is scoped source inspection, not a fresh cross-source differential experiment.

Run from the primary repository root, providing the complete two campaign roots and an absent
destination file. After worktree retirement:

```powershell
node out/hil-bld-joint-review-20261008/hil/analyze.mjs out/hil-retired-2026-10-08/discovery-resume/batch1-hil-resumable out/hil-retired-2026-10-08/hil-exploration-batch2/batch2-hil out/hil-bld-joint-review-20261008/hil/analysis-rerun.json
```

The first two arguments replace old paths; the script does not modify either campaign. Root may
choose a different retained-output prefix; pass that exact root instead. The third argument must
be new (`wx`), so the canonical report is never silently replaced. Absolute input paths and the
generation timestamp will differ after custody relocation, while scientific comparisons should
remain unchanged. This one-off script is a requested offline calculation, not added product code
or a new gate; no full test suite was run for it.
