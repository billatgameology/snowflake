# C1 cold representation analysis — November 11, 2026

The cold lead survives the tested refinement: prism-enabled growth has a larger central-plane
core-to-tip gap at the same physical tip radius in the coarse and both fine seed representations.
It is not confined to a fixed one-cell gap. Timing and later common-age magnitudes remain
representation-sensitive; these findings do not establish continuum convergence or physical causality.

## Inputs and executed calculation

`readout-stable.json` binds all 48 input files (spec, result, events, exit), producers and runtime.
The 12 rows comprise the four historical `oct11-hil-cold-step-t14p4-f0p1-cfl0p025-*` rows
and eight `gd21-hil-c1-h{1|3}-*` rows. All 12 pass `summarizeFirstBatchRow` as size endpoints;
31,443 completed updates were reconstructed. Historical producer is `5a00e901874ae5fdf2ae24a2d889b692734e75da`,
new producer `2f2d605f0ed8fdb8d78cdea02a58102a7001cb53`, all on Node v24.13.1.
All use -14.4 C, forcing fraction .10, CFL .025, pressure 101325 Pa and matched fixed numerical
controls. Coarse spacing is .35 um, fine .175 um; seed thicknesses bracket rather than exactly
match the coarse voxelized seed.

The recipe reuses the October 21/24 cold definitions. It accumulates occupied central-plane ring
counts from attachment events and checks the fully filled core by explicit missing-site membership
at every event. Counts, extents, terminal ages and cycle counts are checked against published bytes.
Every named 8-member cohort and their 12-member union has separate common clocks and plateau minima.
No interpolation, clamping or incomplete-cohort substitution was used. Adjacent-event alternatives
are observation sensitivity, not confidence intervals. All half/quarter increments are in the detailed readout.

Executed from `C:/Users/biao3/Documents/GitHub/snowflake`:

```powershell
node out/hil-results-review-2026-11-11/cold/readout.mjs out/hil-results-review-2026-11-11/cold/readout-stable.json
```

Exit zero; stdout and empty stderr are retained as `stable-stdout.log` and `stable-stderr.log`.
The script also accepts optional coarse and HIL campaign-root arguments after the output path.
`summary.json` contains the concise census, full selected gap tables and unavailable-stage witnesses;
`inputs.json` records hashes separately. Detailed readout SHA-256:
`ce6f14e97447a933a3419fcdfd840f8933594e1cceb602971ae537eda42cdaf0`.

## Matched physical tip

The complete cross-thickness union has a valid first tip-8/coarse, tip-16/fine plateau at
physical radius 2.8 um. Its minimum duration is 0.467403189055569 s, set by fine-thin prism-only.
At .25, .5 and .75 of that shared duration measured from each trajectory's own entry:

| Representation | Neither / basal-only gap | Prism-only / both gap |
|---|---:|---:|
| Coarse | .35 um (1 cell) | .70 um (2 cells) |
| Fine thin | .175 um (1 cell) | .70 um (4 cells) |
| Fine thick | .175 um (1 cell) | .70 um (4 cells) |

Every next-event alternative agrees with these entries. At plateau entry the fine-thick both
case briefly has .875 um, with the next event at .70 um; the table avoids hiding that transient.
Thus the prism-associated lag in core filling is reproducible across these representations and
is not simply a gap of the same cell count on different grids. It remains a discrete model result.

The thin/coarse 8-member tip-9/18 cohort is available: duration 0.5083816188849442 s.
At entry and quarter sample the prism-enabled fine gap is .875 um versus coarse .70 um;
by the .75 sample both fine prism arms have .70 um. Fine controls remain .175 um, coarse .35 um.

The thick/coarse 8-member and union 12-member tip-9/18 cohorts are unavailable.
`gd21-hil-c1-h3-basal-only` first reaches tip 18 at cycle 4586, 39.13064583469429 s,
then reaches its size target without an observed plateau exit. Terminal time was not substituted
for an exit, and the missing row was not removed. This is a coverage limit, not a failed simulation.

## Common physical age

The 12-member common terminal age is 8.92067178910807 s, set by fine-thin prism-only.
At its quarter, half, three-quarter and full samples, all six neither/basal-only controls have
zero core-to-tip gap; the six prism-enabled cases have positive gaps. The direction survives,
but the magnitudes and tip speeds do not agree across representations.

At the full common age, the prism-enabled coarse gaps are .70 um, fine-thin 1.225–1.40 um,
and fine-thick 1.05–1.225 um. Fine-thick both has adjacent-event range 1.05–1.225 um;
other values at that age are unchanged by the adjacent-event choice. The corresponding tip
radii are 3.5 um coarse, 4.725–4.9 um fine-thin and 4.2–4.375 um fine-thick.
These are shared-age observations and must not be conflated with the equal-tip table.

## Interpretation and next discriminating question

This strengthens the cold facet/core-filling lead as a second question alongside warm history.
Its reliable present statement is that enabling the prism dip changes the relative advance of
tips and the fully occupied core in this implementation, with a physical-scale lag visible at
a matched stage in all three representations. It does not establish a permanent hollow core,
a physical SDAK mechanism, full-grid convergence, or domain independence. BLD C0 at -20 C had
shown a transient gap; C1 is at -14.4 C, so that result is context rather than a matched contrast.

The next low-cost analysis is to use the saved boundary snapshots near the registered tip stages
to compare local solved vapor, kinetic coefficients and fill demand on tips versus lagging rings.
This can distinguish candidate explanations before another expensive fine-grid run. A future
terminal-size extension could recover the unavailable thick-seed tip-18 exit, but it needs a
new registered row/protocol; the completed checkpoint must not be relabeled a changed-target resume.

Review provenance: shared-context Codex/GPT-6-family analysis lane; executed saved-data
reconstruction and the named endpoint reader, no simulations or full suite in this lane.
No independent physical observations or novelty assessment were checked. Input and analysis
bytes remain local staging pending the parent's governed preservation step.
