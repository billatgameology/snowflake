# Completed adventure analysis — November 13

All 46 new rows reached the registered extent-29 target with successful exits and empty
integrity-error lists. They took 1.0528688888888889–5.4326574999999995 active wall hours,
median 4.028132916666666; the final row finished at 2026-11-13T15:31:24.797Z
(07:31 Pacific). See [completion and cost](completion-and-cost.json), including every row,
result hash and the maximum-cost witness. Four original fine central-filling workers continue.
This is a saved-data analysis, not another launch or a physical-validation result.

## What the short runs supplied

| Question | Measured result | Decision value |
|---|---|---|
| When does warm opening persistence appear? | At both −4.5 and −5 C, width-3 preparation cut off at 4.25 s reseals; 4.5 and 4.75 s retain the original openings through the target. Width-4 controls reseal. | A narrow, testable onset interval; qualify timestep sensitivity before treating it as a threshold. |
| Does imposed vapor supply matter? | With the same five-second width-3 preparation, forcing fractions .05/.075/.10 give terminal straight opening depths 0/2.10/2.80 um at −4.5 C and 0/2.45/2.80 um at −5 C. Broad and width-4 controls have zero terminal depth. | Supply and preparation history interact in this model. Fixed duration also changes the stage reached, so a supply-only cause is not identified. |
| Does the seed matter? | Thicker radius-2 seeds preserve the opening; wider radius-3 seeds do not establish an original opening by the switch. The wider seed does receive nonzero but delayed width-3 exposure. | Do not describe the wider-seed result as established memory being erased. Starting geometry changes the preparation actually delivered. |
| Does the cold contrast survive other settings? | At the complete seed cohort's tip-8 quarter/half samples, controls lag the tip by .35 um and prism-enabled cases by .70 um. At pressure cohort tip-9, this same contrast holds at all three sampled times and all three pressures. | The previously observed prism-associated core lag survives these particular changes; another broad cold sweep is lower priority than inspecting the saved fields. |

The [warm record](warm.json), [forcing record](forcing.json) and [cold record](cold.json)
contain cohort definitions, named witnesses, observation brackets and limits. Warm comparisons
use the shortest terminal physical age across each complete registered cohort, with quarter-age
samples and adjacent-event alternatives. Equal-size terminal results are reported separately.
Cold samples use each trajectory's own plateau entry plus common elapsed time within the
shortest complete plateau; they are not equal absolute ages. The thick-seed basal-only case has
no observed tip-9 exit, so that complete seed comparison is unavailable. No reduced cohort was
substituted. Same-age cold gaps vary substantially; pressure is not shown to act only on a clock.

## Why retaining switch states matters

The −4.5 C width-3 cutoffs 4.25/4.5 s give an especially useful pair. Last-active retained
states are ticks 109/116 at 4.274608592844379/4.503949605746254 s. Both contain exactly
103 occupied sites and have byte-identical occupancy arrays, SHA-256
`7b1a7e1047f6aa8f1acb004c8b3860420c9876bfba00533366c4747569be61f8`.
Their fill and lattice-vapor arrays differ; the subsequent opening outcomes differ.
Root independently decoded both original solver files and compared full arrays in
[root-warm-witness.json](root-warm-witness.json). This shows that occupied geometry alone
is insufficient to specify these outcomes. It does not isolate partial fill, vapor, numerical
lag or history as the cause. Both rows have zero attached sites in the 14-site central probe
at the switch; empty central occupancy alone is also insufficient.

These captures make the next comparison concrete: examine local fill, solved boundary vapor,
kinetic demand and their subsequent evolution on each side of the onset. Saved lattice vapor
and pre-fill solved boundary vapor are distinct observations and must remain labeled that way.

## Recommended next work — proposal only

Recommend 16 bounded N64 follow-ups while the four fine cases continue:

1. Eight timestep checks: two temperatures × widths 3/4 × cutoffs 4.25/4.5 s at CFL .0125,
   compared with the existing .025 results. First ask whether the persistence distinction survives.
2. Eight supply/duration tests: two temperatures × widths 3/4 × lower-supply longer-preparation
   and higher-supply shorter-preparation. Provisional durations are about 8 s at fraction .05 and
   3 s at .10, with existing five-second controls. These choices are informed by growth-stage
   observations from the longer active-preparation reference trajectories; they do not equate
   physical uptake, selected exposure or complete state. Final timing remains to be registered.
   Compare actual switch geometry, partial fill, local vapor and common-age survival.

These answer a focused question: what preparation is enough to establish a self-maintaining
opening in this implementation? The second group can show whether changing preparation duration
rescues/reverses the forcing contrast, but cannot by itself isolate a single causal state variable.
Keep target extent 29, named switch/age captures, restart checkpoints and no wall limit.
Retain the tested capture/resume route; no new capacity ladder or fine-grid extension is needed
merely to discuss this proposal. Earlier runtime measurements are anchors for the completed
configurations only; halving the timestep and changing preparation can cost more. No new runtime
promise, frozen protocol, run approval or launch is implied by this recommendation.

A wider-seed initially active selector is a useful reserve question, not part of this proposed 16.
Read the existing captured fields before adding another cold parameter grid. The current evidence
narrows model mechanisms; it does not establish new ice physics or explain the Nakaya diagram.

## Execution, review and custody

Analysis used the established warm/cold cohort recipes and existing retained-state readers,
with local cohort-selection adaptations under primary
`out/hil-adventures-review-2026-11-13/{warm,cold,forcing}/`.
[Provenance](provenance.json) binds the local recipes, reports, commands and source input records;
[concise row inputs](row-inputs.json) binds the spec/result/event/exit files. Detailed reports,
recipes and all raw output remain local pending governed NAS publication and fresh restore.
Hash bindings do not preserve those bytes. Keep all output-owning worktrees and the primary
analysis directory; no closure or pruning is authorized here. New bulk payloads stay out of Git.

The three analysis lanes were shared-context Codex/GPT-6-family subagents, not blind reviewers.
Root inspected the complete cohort summaries and limitations, checked all 46 successful result/
exit pairs, directly compared the two warm solver-state witnesses above, and independently
reconstructed selected cold ring/core witnesses from raw attachment coordinates in
[root-cold-witness.json](root-cold-witness.json). That last check covers four named observations,
not an independent re-execution of every metric. No solver behavior was changed, new simulations
run, full suite claimed, or physical gate earned. The scoped metadata/prose check receipt is
[verification.json](verification.json). Numerical-onset qualification and bulk NAS recovery remain
unfinished, explicit next work.
