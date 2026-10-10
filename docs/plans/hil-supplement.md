# Plan — HIL history and pressure supplement

- **Phase:** post-Phase-10 model-development exploration under charter section 2.5 and accepted decisions 0011, 0055 and 0060.
- **Status:** approved; implementation and launch preparation.
- **Started / last touched:** 2026-10-09 by Codex/GPT-6.
- **Branch / checkout:** `codex/hil-supplement`, `C:/Users/biao3/.codex/worktrees/hil-supplement/snowflake`, from `02b1d1d`.
- **Authority:** maker explicitly approved adding and launching the eight proposed cases. HIL only; preserve the four active warm workers at fixed `838c294`.

## Goal

Launch eight additional resumable N64 cases while warm refinement continues: four longer ordinary
temperature histories and four pressure timestep comparisons. Solo scientific research; hostile
actors excluded. The deliverable is eight real workers with committed protocol/source, distinct
outputs, completed-cycle checkpoints, live memory guards and exact pause/resume commands.

## Done when

No charter milestone applies. All eight registered rows are selectable, existing row/queue/resume
seams are reused, focused checks and exact `npm.cmd test` pass at a stable producer, one bounded
review finds no unresolved claim-changing issue, and the actual eight-worker launch is recorded.
Existing warm workers remain active and untouched. Scientific completion is subsequent: eight
terminal dispositions, existing operational row checks, and the registered paired readouts below.
A successful launch or test suite does not establish a scientific result or physical validation.

## Registered rows and controls

All cases use N64, dx 0.35 um, seed radius/thickness 2/1, 20000 maximum completed updates,
aggregate-v6, monopole-matched hexPrism, seeded PRNG seed one, noise zero, residual tolerance
1e-9, divergence tolerance 1e-7 and at most 200000 relaxation sweeps. Supersaturation is computed
with `phase6SigmaWaterFromTable(tempC) * fraction`, including the destination environment.
No numerical law, parameter fit, environment transformation, checkpoint contract or old row changes.

New IDs start `supplement-hil-` and retain their control's suffix:

| New row suffix | Source control suffix after `batch1-hil-` | Changes from control |
|---|---|---|
| `history-t6-to-t14p4-e7-m1` | same suffix | target 21 to 29; add spatial crossings 21 and 25 |
| `history-t6-to-t14p4-e15-m1` | same suffix | target 21 to 29; add spatial crossings 21 and 25 |
| `history-t14p4-to-t6-e7-m1` | same suffix | target 21 to 29; add spatial crossings 21 and 25 |
| `history-t14p4-to-t6-e15-m1` | same suffix | target 21 to 29; add spatial crossings 21 and 25 |
| `pressure-t6-f0p1-p50662p5-both` | same suffix | fill CFL 0.05 to 0.025 |
| `pressure-t6-f0p1-p202650-both` | same suffix | fill CFL 0.05 to 0.025 |
| `pressure-t6-f0p2-p50662p5-both` | same suffix | fill CFL 0.05 to 0.025 |
| `pressure-t6-f0p2-p202650-both` | same suffix | fill CFL 0.05 to 0.025 |

History uses ordinary M1, fraction 0.15, pressure 101325 Pa and exactly one existing extent-triggered
temperature event (7 or 15); no experimental kinetics flags. Its target 29 means maximum center span
9.8 um and samples at 5/9/13/17/21/25. Pressure uses -6 C, explicit `experimentalFacetDips: "both"`
with M1 base metadata, no environment event, target 21 (7 um span), and samples 5/9/13/17. Its only
scientific change is the halved fill CFL. Preserve all original controls and completed targets.

Controls are the eight corresponding rows under primary
`out/hil-retired-2026-10-08/discovery-resume/batch1-hil-resumable/rows/`. Their spec/result/events/exit
bytes are bound by `evidence/hil-bld-joint-review-2026-10-08/discovery-resume-archive.json` and preserved
in `hil-completed-runs@2026-10-09`. Before implementation, all 32 files matched those length/hash
entries; `summarizeFirstBatchRow` rederived eight extent-21 size endpoints, zero errors, exit zero.
All eight name source `b9cf7ed`, Node v24.13.1. Compared with `02b1d1d`, numerical solver,
discovery evolution and sigma-table bytes are unchanged; the core resume cell bound/messages
and publication rename retry changed. Keep source provenance explicit; do not migrate their checkpoints.

## Readout and decision

Use the existing [saved-data follow-up](../../evidence/hil-bld-joint-review-2026-10-08/followup/README.md)
event reconstruction and plane/shell definitions. Producers already emit seed, attachment events,
physical times, timeline transition, spatial snapshots, result and restart state. No new observer
or evaluator is needed to launch this finite block.

History: within each direction compare switch-7/switch-15 additions from the actual event boundary
at common elapsed physical times, with adjacent-event brackets and separate early/later windows.
Report axial/lateral center-span additions, occupied-cell additions and opening/profile changes;
trigger-cycle attachments precede the event and belong to starting state. Compare the new trajectory
prefixes with retained controls before using their longer continuation. Reuse old static controls
only over their observed duration; no claim of approach to a long-time static shape is authorized.
An insufficient common post-switch window remains unresolved, not absent memory.

Pressure: compare each new CFL 0.025 row to its exact CFL 0.05 control at common size and separately
common physical age. Reuse off-equator shell occupancy and central opening profiles, retaining
brackets and physical spans. Evaluate whether the low/high-pressure ordering at fraction 0.10 and
0.20 persists or changes with the timestep. This measures discrete numerical sensitivity, not a
physical pressure mechanism, mass, continuum convergence or domain independence.

Size targets require the existing numerical/integrity checks. Step-cap, contact, stalled growth,
convergence failure or resource interruption is explicitly unresolved/failed according to its
actual record; never treat it as absence of an effect. No production wall-clock deadline.

## Execution and admitted failure

Use one small roster and a thin named entry/coordinator around `runNamedDiscoveryBatch` worker
routes, `launchDiscoveryRows`, `acquireFirstBatchLease`, `planFirstBatchResume` and `sampleBatchHost`.
Existing CLIs require a new exact probe receipt for their ordinary launch route; do not forge or
relabel a prior receipt. This task instead records an explicit bounded operational worker budget
and invokes the unchanged queue directly, following the current warm parallel-continuation seam.
It does not modify the ordinary probe-validation route or build a general scheduler.

Requested concurrency is eight additional workers (twelve total with the four warm workers), within
the existing declared HIL ceiling of sixteen. This is an operational choice using prior measured
N64 operation and current live headroom, not a transferred throughput qualification. At
`2026-10-09T21:16:13.1955595Z`, the active warm resource log records 50304802816 available physical
bytes and 58361036800 commit-headroom bytes, with four workers. The completed HIL second batch
ran sixteen checkpointing N64 workers. No capacity ladder or speed-admission timeout is repeated.
Both campaigns retain their host-global 12 GiB available-RAM / 8 GiB commit-headroom guards.
Shared cache/bandwidth effects and mature performance are unmeasured.

Accidental wrong-source/row continuation or concurrent writers can corrupt scientific state
(lessons A3/E4). Existing row codecs, campaign lease, pending-row selection and live guards cover
the nearest boundaries; a small campaign invocation binds this roster, committed source, host,
Node/V8 and budget before launch/resume. Existing named-batch validation cannot consume a budget
record without a fake probe, so this specific coordinator is the smallest missing seam. No hostile
owner checks or new general registry are admitted. Tests cover exact registered control differences,
wrong-bound resume refusal, live-owner/pending selection reuse and actual worker routing.

Checkpoint each completed update, retain two generations, and repeat only an unfinished relaxation
after interruption. Existing N64 real pause/resume evidence under ADR 0060 and the unchanged N126
witness remain applicable to this unchanged state contract; do not repeat that scientific proof.
The new coordinator's recovery wiring still receives focused tests. Freeze the executing checkout
after launch and write later live-state records in primary.

Commands to implement, from this task checkout (set the process-only Windows module path first):

```powershell
$env:PSModulePath=Join-Path $env:SystemRoot 'System32/WindowsPowerShell/v1.0/Modules'
node runner/src/hil-supplement-main.ts launch HIL out/hil-supplement
node runner/src/hil-supplement-main.ts resume HIL out/hil-supplement
node runner/src/hil-supplement-main.ts summarize out/hil-supplement
```

Background launch uses `Start-Process -WindowStyle Hidden`, with unique coordinator stdout/stderr
and real exit receipt. A task-specific stop helper targets only this coordinator and its recorded
workers, preserving all checkpoints and logs. Record its exact path at launch. Leave the warm
coordinator/workers and their receipts unchanged; never launch into their campaign path.

## Source currency and retention

Checked 2026-10-09 before registration: official histories retain
[TAX2 v1](https://arxiv.org/abs/2306.13087), [CM9 v1](https://arxiv.org/abs/2011.02353) and
[CM4 v2](https://arxiv.org/abs/1512.03389). The
[author publication list](https://www.its.caltech.edu/~atomic/publist/kglpub.htm) has no newer
snow-growth entry than its 2023 entries; its later listed 2025 papers concern teaching experiments.
This bounded check found no superseding source for adopted operands; no fit or source claim changes.

Rule 15 / ADR 0061 govern eventual closure: preserve full campaign, failed attempts and control
payloads in governed NAS collections with verified fresh recovery before closing this worktree.
Git receives code, protocol and concise verification/analysis records, not bulk archives. No local
pruning is authorized. Existing controls already have NAS coverage; no duplicate copy is needed.

## Steps

- [ ] Commit this protocol before implementation and add the bounded roster/entry/coordinator.
- [ ] Complete focused checks, one bounded review and exact full check at stable producer.
- [ ] Publish tested code, launch eight workers, and record actual processes, logs and recovery.
- [ ] After terminal results, compare the registered pairs and preserve the useful outputs on NAS.

## Out of scope

Solver/codec changes, old target extension or checkpoint migration, new capacity ladders, warm
campaign interruption, BLD dispatch, new seed/cold matrices, observer changes, Phase 7/S6, physical
validation, public scientific conclusions and worktree closure before campaign preservation.

## Tried and rejected

- Repeating the longer ordinary -8 C seed pair would duplicate September extent-29 controls.
  Mixed-facet seed rows remain a later option after recovering those controls.
- Sparse cold extent samples missed prism-bearing states; repeating that observation design
  would not answer the field question. It is deferred instead of blocking this ready supplement.
- Repeating a timed capacity ladder treats slow work as ineligible; the maker rejected that policy.
  Retain applicable measurements, actual concurrency and live resource guards.
- Silently increasing finished rows' targets would rewrite their identity; these are new rows
  with separate outputs and registered finite targets.
