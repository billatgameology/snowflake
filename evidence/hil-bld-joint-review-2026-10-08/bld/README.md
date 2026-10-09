# BLD result review — 2026-10-08

Read-only retrospective model exploration by Codex/GPT-6 with shared parent context. No solver
run, checkpoint adoption, physical validation, grid-qualification claim or production change.
The parent owns custody/branch retirement and publication. These are analysis staging bytes.

## Inputs, producer and reproduction

`bld-analysis.json` records SHA-256 and byte length of the 42 row specs/results/event logs,
source IDs, script hash and all selected physical-time brackets. `cavity-readout.json` also
binds exit records and the recorded boundary snapshots and retains the existing analyzer's
definitions, per-plane enclosure and spatial profiles. No raw input was changed.

The producer is `d7ff3e1fb122ecbf8994539d3623928cbe5a9c6b`, recoverable through permanent tag
`run/bld-first-batch-2026-10-08`. Analysis source was primary `37e4572`. Blob comparisons show
the three cavity analysis/geometry/spatial modules, `core/src/libbrecht.ts` and
`core/src/metrics.ts` unchanged between those sources. Inspected `lk-solver.ts` differences
concern resume adoption/export and experiments' restored state; inspected discovery runner
differences concern continuation plumbing, source binding, operational timing and stop/cap
handling. No evolution-loop equation or saved scientific event/readout calculation changed in
those inspected hunks. This supports using saved BLD observations with these unchanged
readouts; it does not certify cross-producer trajectories or checkpoint compatibility.

Original input root (recorded in generated artifacts):
`C:/Users/biao3/.codex/worktrees/hil-bld-results-integration/snowflake/out/restores/bld-first-batch-output-2026-10-08/batch1-bld-resumable`.
After the parent retains that worktree's output, the intended equivalent root is
`C:/Users/biao3/Documents/GitHub/snowflake/out/hil-retired-2026-10-08/hil-bld-results-integration/restores/bld-first-batch-output-2026-10-08/batch1-bld-resumable`.
Confirm the parent retention receipt before using that new locator. Reproduce from primary:

```powershell
$env:BLD_REVIEW_INPUT = 'C:/Users/biao3/Documents/GitHub/snowflake/out/hil-retired-2026-10-08/hil-bld-results-integration/restores/bld-first-batch-output-2026-10-08/batch1-bld-resumable'
$env:BLD_REVIEW_OUTPUT = 'C:/Users/biao3/Documents/GitHub/snowflake/out/hil-bld-joint-review-rerun'
node evidence/hil-bld-joint-review-2026-10-08/bld/analyze.mjs
```

The script writes only its two analysis JSON outputs in the named output directory. The originally
executed program is retained byte-exact as `analyze-recorded.mjs`; the current `analyze.mjs` adds
only an output-directory override and creation. The generated JSON retains the original producer
script path/hash, which now resolves through this preserved recorded copy. Its all-42-row reconstruction completed
successfully. The existing cavity analyzer confirmed all nine cold quartets have matched
recorded nonkinetic/fixed controls and admissible endpoints. It checks saved seed/event counts,
sequential physical time, occupancy uniqueness, snapshot association and experiment identity.
Existing operational coverage was separately verified during pickup. No test suite or independent
review is claimed for this one-off analysis.

## Cold facet finding

Core is the largest completely occupied central-plane integer hex ball, and tip is the maximum
occupied radius in that plane. Gap is tip minus core. This is an explicitly defined post-hoc
occupancy readout, not a new gate; old reports' core/tip formulas are not presumed equivalent.
The selected common tip is the largest available to all four arms with a positive recorded
plateau duration. We sample half the shortest such duration, in physical seconds since each
row first reached that exact tip, retaining the surrounding event bracket. No cycle alignment.

| Temperature C | Forcing fraction | Common tip, cells | Matched plateau age, s | Gap: neither / basal-only / prism-only / both, cells |
|---|---:|---:|---:|---|
| -12 | .10 | 8 | .7485473701 | 1 / 1 / 2 / 2 |
| -12 | .15 | 9 | .3969843946 | 1 / 1 / 2 / 2 |
| -12 | .20 | 9 | .2994869711 | 1 / 1 / 2 / 2 |
| -14.4 | .10 | 8 | .8276213763 | 0 / 0 / 2 / 2 |
| -14.4 | .15 | 9 | .3303470677 | 1 / 1 / 2 / 2 |
| -14.4 | .20 | 9 | .2329191389 | 1 / 1 / 2 / 2 |
| -18 | .10 | 7 | .4378670272 | 1 / 1 / 1 / 1 |
| -18 | .15 | 8 | .6560261258 | 0 / 0 / 1 / 1 |
| -18 | .20 | 9 | .3220655467 | 1 / 1 / 2 / 2 |

The nominal hex-coordinate spacing is 0.35 um; multiplying this integer gap by spacing is not
an exact Euclidean radial-distance measurement. At these selected states, the prism intervention accounts for
the observed extra radial gap in eight of nine groups; the -18 C/.10 group has no gap contrast.
The basal intervention is not generally irrelevant: counts, times and some final dimensions
differ between both and prism-only, and between basal-only and neither. These are small, discrete
differences, and the earliest/last saved states can depend on the selected bracket. Absolute-age
and first-common-tip selections are retained separately in `coldGroups`; do not present unequal
terminal ages as a common-time comparison or promote the selected states to an all-trajectory law.

## Warm history finding

The shorter N64 window does reach switch-off, and subsequent advancing hollow growth is observed.
The unchanged analyzer supplies per-row history even though its historical five-arm group flag
correctly remains false for this three-arm design. The separate early/full observation-prefix
comparison uses exactly the existing analyzer's finite scientific field list.

| Measured quantity | -4.5 C | -5 C |
|---|---:|---:|
| Actual switch time, s | 20.0484056934 | 20.0516311308 |
| Crossing update; exact matching early/full observation prefix | 264 | 284 |
| Post-switch updates observed | 330 | 274 |
| Original signed open planes surviving to stop | 14 | 16 |
| New post-switch signed open planes surviving to stop | 4 | 4 |
| Tip advance after switch, um | 1.05 | .70 |
| Selected-cell updates / selected kinetic demand after switch | 0 / 0 | 0 / 0 |
| Early terminal physical age, s | 53.4003677457 | 44.8677027338 |
| Early terminal open planes; maximum axial-envelope depth, um | 18; 3.15 | 20; 3.15 |

Planes are signed axial layers, not independent cavities. New outermost openings can be
right-censored at stop. The depth is below the occupied axial envelope, not local aperture size.
At the common physical ages 27.9927159009 / 26.3989667974 s, early has 16 open planes and
2.45 um depth at both temperatures; broad has zero and full has 18 and 3.15 um. The early
at-or-before time brackets are [27.9318356790, 28.0083226974] and
[26.3542468087, 26.4247139656] s. Full finishes at those requested common times. Continued
enhancement therefore changes growth after the switch even though it is unnecessary for the
observed post-switch cavity persistence in these two rows.

## Next options to discuss, not a dispatch

1. Warm track: reuse this N64 coarse reference and discuss the already identified physically
   matched grid/seed-width comparison. The one-cell solid waist survives here, so the key
   unresolved question is whether post-switch advancing openings persist when the width threshold
   and seed representation are changed with spacing. Avoid another same-grid temperature scan or
   merely repeating the already observed cutoff. The target must allow meaningful post-cutoff
   growth, not just switch reach. The prior N112 longer window is complementary existing evidence.
2. Cold track: the mixed arms now point to prism preparation. First inspect saved spatial snapshots
   around a strong -14.4 C anchor and the weaker -18 C/.10 exception, then select a bounded
   numerical refinement/observation-window comparison if that would change the interpretation.
   The saved basal center/rim profiler is not a prism core/tip causal diagnostic; no such claim
   is made here. Do not jump directly to a new prism-width law from endpoint shapes.
3. Combine with HIL's seed/pressure/environment results before choosing queue sizes. These findings
   support useful internal model questions, not new validated ice physics. Resume/producer readiness
   for any larger grid remains a separate launch prerequisite, not a reason to repeat these rows.
