# HIL H1 pressure/history results — November 11, 2026

The longer histories retain an early-switch axial head start, but do not support a
uniformly faster late growth rate. This is a scoped model-development lead. It does not
identify a physical mechanism or establish a Nakaya explanation, domain independence,
continuum convergence or validation.

## Registered comparison and results

`readout.json`, `summary.json` and `input-hashes.json` bind all 12 new H1 endpoints:
ordinary M1, -14.4 to -6 C, fraction .20, N96, dx .35 um, seed 2/1, CFL .025,
target 57, three pressures and source/destination controls. All endpoints pass the
existing checker, all 26,001 recorded updates reconstruct, and all six histories'
scientific source prefixes equal their matched source-static trajectory through the
completed trigger cycle. Trigger-cycle attachment is inherited, not post-switch growth.

The frozen shared post-event duration is **27.824753761835478 s**, limited by
`gd21-hil-h1-p50662p5-switch7`. It is longer than the prior 7.547248938077988 s window.
The rows below compare added axial span after each actual event, excluding inherited
span. Each axial difference has identical at-or-before and adjacent-event bounds.

| Pressure (Pa) | Full window switch 7 / switch 15 (cells) | Early minus late (um) | Later-half difference (um) | Successive-quarter differences (cells) |
|---:|---|---:|---:|---|
| 50662.5 | 56 / 48 | 2.80 | .70 | 6, 0, 0, 2 |
| 101325 | 36 / 30 | 2.10 | 0 | 4, 2, 0, 0 |
| 202650 | 22 / 16 | 2.10 | .70 | 4, 0, 2, 0 |

The normal-pressure late halves tie, and both final quarters tie at normal and double
pressure. A retained accumulated lead is different from a continuing growth-rate
advantage. The advantage also does not mean more new occupied sites: full-window
switch-7 minus switch-15 additions are -4264/-2702/-1440 sites at increasing pressure,
with respective adjacent-event bounds [-4312,-4264], [-2726,-2702], [-1464,-1428].
Occupied sites are not deposited mass; the later-switch rows inherit larger geometry.

## Fixed earlier window and numerical limit

The frozen D0 = 7.547248938077988 s and D0..2D0 requests are covered by all six histories.
Early-minus-late axial differences in the first window are 6/4/4 cells across increasing
pressure; in the second they are 0/2/2 cells. These bounds are exact for adjacent events.

The prior N64/.025 comparison at the same D0 gave 6/6/4 cells. The normal-pressure early
history adds 12 cells in N96 versus 14 in N64, while the late history adds 8 in both.
Thus the sign survives, but the precise normal-pressure magnitude changes by .70 um.
`summary.json` binds the historical comparison and a clean numerical-source diff between
its producer and the HIL producer. Domain size and terminal target differ; same spacing
is not grid convergence and this is not a proof of domain independence.

## Static coverage

Controls do not set Dnew. Continued-source controls use each actual history event age
as their origin, and destination controls use fresh-seed age zero. Coverage was checked
before calling the existing helper; no overlong request was clamped.

| Pressure (Pa) | Source static covers full Dnew? | Fresh destination covers full Dnew? |
|---:|---|---|
| 50662.5 | No, for either switch | No |
| 101325 | No, for either switch | Yes |
| 202650 | Yes, for both switches | Yes |

Half-pressure sources cover only quarter 1 and D0; normal-pressure sources cover the
first half and D0..2D0 (switch 7 also covers quarter 3). Detailed availability is in the
summary. At double pressure the full warmed-minus-continued-source axial additions
are 10 cells for switch 7 and 8 for switch 15. Other pressures lack that full-window
contrast. Destination fresh seeds are context, not matched inherited-state controls.

## What to do next

Do not extend this queue simply to collect longer histories. The main unresolved question
is what carried the memory: geometry, partial fill, vapor field or their coupled evolution.
A registered common-state intervention that varies one retained component would be more
discriminating, but requires a separate state-intervention contract and must not be
mislabeled ordinary resume. If a quantitative history prediction becomes the priority,
first qualify the normal-pressure domain sensitivity using matched fixed physical windows
and controls that cover them. Current evidence supports persistence of a prepared-state
lead, not permanent acceleration or geometry-only attribution.

## Recipe and review limits

From primary repository root with Node 24 and locked dependencies:

```powershell
node out/hil-results-review-2026-11-11/history/readout.mjs C:/Users/biao3/.codex/worktrees/hil-growth-dynamics-oct21/snowflake/out/hil-growth-dynamics-oct21 out/replay-h1/readout.json
node out/hil-results-review-2026-11-11/history/summarize.mjs out/replay-h1/readout.json
```

Output files must be absent. The recipes work unchanged when copied to the same depth
under `evidence/`; readout accepts an explicit restored campaign root containing `rows/`.
Executed default commands exited zero; readout stderr was empty. The detailed readout
SHA-256 is `7a614c73f28111f5176e33bf629f51ed86cae0fbe0b6b6607548416fa17f5a47`.
The author used inherited/shared GPT-6 project context and reused the October 21
reconstruction, bracket, window and contrast definitions. New selection and window
packaging are direct analysis recipes; no solver, checkpoint or simulation was changed.
The parent independently recomputed the history axial/occupancy contrasts from raw event
coordinates without the window helper; that receipt lives alongside this lane. Full-suite
status belongs to the parent task receipt, not this report. Detailed outputs remain local
pending NAS preservation; raw HIL output is still in its retained execution checkout.
