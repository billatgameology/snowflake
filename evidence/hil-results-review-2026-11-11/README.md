# HIL and BLD growth dynamics — completed-data interpretation, November 11

The strongest lead is persistent warm growth structure after early preparation ends.
The new HIL results strengthen it under timestep refinement and also strengthen a separate,
stage-specific cold core/tip effect. Longer temperature histories preserve an axial-growth
head start but weaken the interpretation that early preparation produces indefinitely faster
growth. These are findings within the implemented model, not new physical identification or
an explanation of the Nakaya plate/column transitions.

## What the completed HIL groups add

| Question | Matched result | What it supports and what remains open |
|---|---|---|
| W4: does warm hollow growth survive timestep refinement? | At exact largest lattice-coordinate center span 9.8 um, early-prepared depths are 3.50 um coarse and 4.025 um in both fine seed thicknesses at CFL .05 and .025; all broad controls are zero. At the twelve-member common age 55.9289191088165 s, depths are 3.15/3.675/3.675 um at both CFLs. | The prepared structure survives the tested timestep and seed representations. Coarse/fine depths and growth timing still differ; this is not continuum convergence. |
| C1: is the cold core/tip gap only a fixed-cell artifact? | At physical tip radius 2.8 um and .25/.5/.75 of the full cohort's shortest plateau duration, prism-only/both gaps are .70 um in coarse and both fine thicknesses: two coarse cells versus four fine cells. Controls are .35 um coarse and .175 um fine. | A physical-distance contrast survives refinement at this stage. Absolute-age gaps differ, and the full 3.15 um-stage comparison is unavailable because one thick-seed control lacks a plateau exit. |
| H1: does an early warming history keep gaining faster? | Over 27.824753761835478 s after each actual switch, early-minus-late axial additions are 2.80/2.10/2.10 um at half/normal/double pressure. In the later half they are .70/0/.70 um. | A retained head start, with stage-dependent growth increments. Normal-pressure later growth ties. Precise magnitude remains sensitive to the domain comparison. |

[Warm findings](warm/findings.md), [cold findings](cold/findings.md) and
[history findings](history/findings.md) give complete cohorts, brackets, coverage and limits.
The summaries carry numeric witnesses and input bindings. Stage brackets are discrete-event
sensitivity, not statistical confidence intervals. Occupied sites are not deposited mass.

## Combined interpretation with BLD

BLD's earlier [matched analysis](../../docs/plans/hil-bld-growth-dynamics-oct21.md#hil-verification-and-interpretation--october24)
showed that early preparation duration and width affect whether an opening persists. Width 3
at early 5 s retained it, whereas widths 2 and 4 did not at the shared ages, despite width 4
receiving more selected basal demand. HIL now shows that the principal warm effect is not
removed by halving the fine-grid timestep. After the early selection ends, selected demand
is zero and original openings persist and advance; the new fine cases add 1.225 um of tip
advance above their original interval ends by their endpoints.

The useful distinction is **where new ice is placed**, not simply faster axial extension.
In each warm matched post-switch window, early and broad runs have equal axial increments
(1.75 um fine, 2.10 um coarse) while retaining different hollow structure. In H1 the early
histories add more axial span but fewer occupied sites over the common duration: 4264/2702/1440
fewer sites at increasing pressure. These observations motivate a coupled state-history
question; they do not attribute the memory to geometry alone. Geometry, partial fill and
vapor state evolve together.

The cold result is a distinct useful lead about how facet kinetics distribute growth between
the advancing tip and the filling core. It is not a permanent hollow-core result. BLD's
separate -20 C timestep series showed a transient gap that later closed; HIL C1 is at -14.4 C
and must retain its own conditions. Agreement at one spatial stage does not imply agreement
at all ages or temperatures.

The broader facet results remain mixed: opposing axial effects and interactions are useful,
but BLD's occupancy sensitivity remains unresolved. The finer two F0 timesteps agreed on
sign while their adjacent-event ranges did not overlap. Do not promote that quantity to a
converged prediction merely because warm depth is stable.

## Recommended next decision

Prioritize the saved-state mechanism analysis around BLD width 3 versus width 4 at early 5 s,
and early 1 versus early 5 s. Reconstruct geometry at the exact switch and inspect per-update aggregate facet/width
diagnostics, then compare the later boundary profiles at their actual saved times. This costs no new
simulation and tests whether placement/exposure predicts later sustained opening better than
total selected demand. The [saved-data availability record](warm/availability.json) confirms that none of these six
BLD cases has an exact-switch spatial snapshot: the only earlier snapshot is at age zero;
first later snapshots are about 6.04-7.47 s, after actual switches near 1.03 or 5.02 s.
Boundary snapshots contain spatial fill/vapor/kinetic values but are not full vapor fields.
Exact-switch geometry and aggregate event diagnostics are available; full switch-time state
is not retained by the terminal current/previous checkpoint pair.

Use that result to register a discriminating prediction before any further run. A controlled
same-state intervention could separate which state component carries the memory, but it
requires an explicit new state-intervention contract; it is not ordinary checkpoint resume.
For the cold lead, first inspect the retained core/rim histories across the available plateau,
then decide whether a successor targeting the missing 3.15 um plateau exit would change the
conclusion. Do not automatically spend another multi-week fine batch on more endpoints.

No reserve was selected and no simulation launched. Phase 10 remains open for the maker's
portfolio review. A scientific breakthrough would require a scoped new mechanism/prediction,
numerical qualification and independent physical evidence; these simulations alone establish
none of those external claims. The present advance is two stronger, testable model leads.

## Verification, reproduction and custody

Three Codex analysis lanes used inherited/shared context and executed the registered saved-data
reconstructions. Parent inspection checked the headline scopes and independently recomputed
H1 axial/occupancy contrasts directly from attachment coordinates, without the analysis
window helpers; see [receipt](independent-history.json) and [recipe](independent-history.py).
This does not independently verify every cavity, ring or bracket calculation. A [bounded shared-context integration review](integration-review.json) checked the warm/cold
summary witnesses against the integrated conclusions and found no required correction. Its
reviewer authored H1 and did not re-review that lane or independently reconstruct warm/cold
geometry. Repository
regression outcome is recorded separately in `verification.json`.

Reproduce from the repository root with locked dependencies and the retained/restored inputs:

```powershell
$env:W4_ANALYSIS_OUT = 'out/replay-w4'
node evidence/hil-results-review-2026-11-11/warm/analyze.mjs
node evidence/hil-results-review-2026-11-11/cold/readout.mjs out/replay-c1/readout.json
node evidence/hil-results-review-2026-11-11/history/readout.mjs C:/Users/biao3/.codex/worktrees/hil-growth-dynamics-oct21/snowflake/out/hil-growth-dynamics-oct21 out/replay-h1/readout.json
node evidence/hil-results-review-2026-11-11/history/summarize.mjs out/replay-h1/readout.json
```

Use absent output targets. Cold requires its output parent directory to exist; create
`out/replay-c1` first. Warm input roots use `W4_HIL_ROWS`, `W4_BLD_ROWS` and `W4_OLD_ROWS`;
cold accepts coarse and HIL campaign roots after its output path. Input hashes remain the
identity authority after restoring to a different mount or directory. The `summarize.py`
warm convenience script expects the detailed report beside itself; use the retained local
copy there, or the detailed JSON directly. It is not needed to produce the full comparison.

Concise summaries, recipes and input hashes are preserved here. Detailed reports remain under
primary `out/hil-results-review-2026-11-11/`; original HIL output remains in its execution
checkout. HIL bulk output and these detailed reports have not yet been published/recovered
on NAS. BLD raw inputs retain their existing verified NAS collection. Keep both local output
owners open until the HIL preservation task has completed; no bytes were pruned.
