# Warming history, pressure and timestep — October 21, 2026

The selected later-half axial difference survives the new timestep comparison at
all three pressures. The quarter windows reveal an intermittent attachment-stage
effect: the third quarter ties and the fourth supplies the later-half advantage.
This supports a bounded model-development lead, not continuously faster growth,
physical memory erasure, pressure universality or validation.

## Matched result

[summary.json](summary.json) and [input-hashes.json](input-hashes.json) bind twelve
warming histories and twelve statics: ordinary M1, -14.4 to -6 C, fraction .20,
N64, dx .35 um, seed2/1, target29, pressures50662.5/101325/202650 Pa, CFL .05/.025,
and history switch extents7/15. All24 endpoints pass the existing checker;
18,108 recorded updates were reconstructed. Each of the twelve history scientific
prefixes equals its matching same-pressure/same-CFL source static through the trigger
cycle. Trigger-cycle attachment precedes the event and is inherited, not new growth.
Every CFL pair differs only in ID/CFL; pressure peers differ only in ID/pressure.
Producer source parity and exact row identities are retained in the summary.

The new joint post-event duration is **7.547248938077988 s**, limited by
`oct19-hil-pressure-step-history-t14p4-to-t6-f0p2-e15-p50662p5-m1-cfl0p025`.
It replaces the old comparison duration for this twelve-row claim. All values below
are new axial-span increments after the event, in lattice cells; multiply by .35 um.
Both CFL settings give the following at-or-before values, with identical adjacent-event
axial bounds at the registered endpoints:

| Pressure (Pa) | Full-window switch7 / switch15 | Later-half switch7 / switch15 | Early-minus-late successive quarters |
|---:|---|---|---|
| 50662.5 | 20 / 14 | 8 / 6 | 4, 0, 0, 2 |
| 101325 | 14 / 8 | 6 / 4 | 2, 2, 0, 2 |
| 202650 | 8 / 4 | 4 / 2 | 2, 0, 0, 2 |

The later-half early-minus-late difference is two cells (.70 um) in all six
pressure/CFL comparisons. Full-window differences are six/six/four cells across
the three pressures. Increasing pressure reduces the measured axial increments
over this fixed physical duration, within each switch and CFL. The agreement does
not extend to every quantity: all six CFL pairs have identical axial increments in
each of seven windows, but only five of six have identical full-window lateral
increments and only one of six identical full-window occupied-site increments.
At202650 Pa/switch7, the smaller-CFL full lateral increment exceeds the old value
by .12435565298214257 cell (.0435244785437499 um), outside the adjacent-event
alternative. At50662.5 Pa/switch7, smaller-CFL full occupied-site addition is106
higher, with bracket difference94..106 sites. Occupancy is not mass.

The axial advantage also does not mean more added occupied sites. Early-minus-late
full occupied additions are -1778/-1660 sites at half pressure, -974/-974 at normal
pressure, and -520/-496 at double pressure, with .05/.025 ordering. Their full
brackets remain negative. The late-switch histories inherit larger source geometry;
different directional growth and occupied-site additions answer different questions.

## Static coverage and interpretation boundary

All six destination statics cover0..D. Their full axial increments are22/14/10
cells across increasing pressure at both CFL settings. They begin from a fresh seed,
with no inherited source geometry; they are labeled context rather than matched
counterfactual histories. For continuing source-static growth at eventAge..eventAge+D:

| Pressure | Coverage at both CFL settings |
|---:|---|
| 50662.5 Pa | Full window unavailable for either switch. Switch7 covers early half and quarters1/2; switch15 only quarter1. |
| 101325 Pa | Full window unavailable for either switch. Both cover early half and quarters1/2; switch7 also quarter3. |
| 202650 Pa | All seven windows available for both switches. |

The corresponding source-static terminal ages (.05/.025) are4.345712822726849 /
4.292872348401459 s, 7.62076737684371 / 7.5770955179573 s, and
14.355355048318135 / 14.207431468610224 s. The summary preserves requested
endpoints, actual terminal ages and every unavailable window. Coverage was checked
before invoking the old helper that otherwise clamps an overlong endpoint; no D
shortening or extrapolation concealed missing source-static comparisons.

At double pressure, the continued-source full axial increments are6 cells for
switch7 and4 for switch15, at both CFLs, versus8/4 for their warmed histories.
That comparison is available only in its named coverage and cannot establish a
general response across all three pressures. Other metrics and their brackets
remain in the summary and bound derived readout.

## Next discriminating options

Prefer a new shared-geometry restart intervention if the question is whether the
inherited geometry or the environment change drives the response. It needs a
separately registered state/control protocol; these natural-history pairs alone
cannot isolate them. If the question is duration instead, define a common physical
post-event endpoint beyond the present size-limited overlap with matched source
controls; the present data do not authorize target extension. Neither option is
approved or launched here. A broad pressure expansion or more identical short
cases would not resolve those two limitations.

Author's skeptical pass: six pairs at two CFL values qualify the sampled axial
increment, not a converged trajectory or a pressure law. Quarter3 ties everywhere,
occupied-site differences remain sensitive, and missing continued-source windows
are real limits. The failed cooling fraction .10 row is outside this complete
warming fraction .20 set and receives no new status from this result.

## Reproduce and recover

Use a repository checkout with these recipes, named producer commits and locked
dependencies, Node24, and absent output paths. Optional arguments identify campaign
roots containing `rows/`. The observed HIL locations remain defaults:

```powershell
node evidence/hil-results-review-2026-10-21/history-pressure/readout.mjs out/replay/history.json C:/restore/oct11/out/hil-large-batch-oct11 C:/restore/oct12/out/hil-two-day-oct12 C:/restore/oct19/out/hil-facet-pressure-oct19
node evidence/hil-results-review-2026-10-21/history-pressure/summarize.mjs out/replay/history.json out/replay/history-summary
```

Use the task's preservation receipt/catalogue to fresh-restore these three campaigns;
replace example prefixes with restored locations. The final execution used explicit
original roots under `C:/Users/biao3/.codex/worktrees/` and output
`out/analysis-2026-10-21/history-pressure/readout-final.json`, exit0. Its digest is
`e8f67e0b585adafa6b0592ed436f87ae6590682ae385c8b211f6a4c81c1d4d45`;
`readout-final.stdout.log`/`readout-final.stderr.log` retain execution output.
Replay can change local path strings and timestamps, not the expected scientific
values or bound raw bytes.

`read`, `profile`, `choices`, `delta`, `window` and the scientific prefix selector
are copied unchanged from the October18 recipe. The current recipe adds exact row
selection, joint duration and quarter windows, explicit coverage, and the same
independent bracket-difference arithmetic used by October18 `summarize.mjs`.
The small summary recipe selects fields and counts equality over the named set.
This is executable scientific readout logic under Rule6; the task-level receipt
owns the exact full-suite verification. This note makes no full-suite-green claim.
Codex/GPT-6 shared-context subagent authored, executed and skeptically inspected it;
there was no independent gate review or new physical validation. Raw producers
were read-only. No simulations, solver changes or event-policy changes occurred.
