# Plan — HIL longer history and cold facet exploration

- **Phase:** post-Phase-10 model development under charter section 2.5 and accepted ADRs 0011, 0055 and 0060.
- **Status:** ten workers launched and checkpointing alongside four warm workers; scientific completion and analysis pending.
- **Started / last touched:** 2026-10-10 by Codex/GPT-6.
- **Branch / checkout:** `codex/hil-exploration-oct10`, `C:/Users/biao3/.codex/worktrees/hil-exploration-oct10/snowflake`, from `b02bbd1`.
- **Authority:** maker requested another 8–12 useful runs beside ongoing HIL work. This plan registers ten; preserve the four warm workers and their fixed checkout.

## Goal and done when

Solo scientific research; hostile actors excluded. Launch ten useful, resumable N64 comparisons
alongside the four active warm rows, using existing physics, observations and recovery. No charter
milestone is claimed. The immediate deliverable is ten registered workers with committed source,
separate logs, completed-cycle checkpoints and exact recovery commands. Done for launch when the
focused orchestration checks and both typechecks pass, one bounded review has no unresolved
claim-changing issue, all ten workers have started, and the warm workers remain active. Later
scientific completion requires ten terminal dispositions and the matched readouts below.

## Registered rows

Copy the indicated `FIRST_BATCH_ROWS` row; preserve every operand except the explicit differences.
New IDs use `oct10-hil-` followed by the suffix in this table. All targets change from 21 to 29.

| New suffix | Original ID prefix | Spatial sample extents | Additional change |
|---|---|---|---|
| `history-t6-to-t14p4-e7-nodip` | `batch1-hil-` | 5/9/13/17/21/25 | none |
| `history-t6-to-t14p4-e15-nodip` | `batch1-hil-` | 5/9/13/17/21/25 | none |
| `history-t14p4-to-t6-e7-nodip` | `batch1-hil-` | 5/9/13/17/21/25 | none |
| `history-t14p4-to-t6-e15-nodip` | `batch1-hil-` | 5/9/13/17/21/25 | none |
| `cold-t14p4-f0p1-both` | `batch1-bld-` | 5/7/9/11/13/15/17/19/21/23/25/27 | assign HIL |
| `cold-t14p4-f0p1-neither` | `batch1-bld-` | 5/7/9/11/13/15/17/19/21/23/25/27 | assign HIL |
| `cold-t14p4-f0p1-basal-only` | `batch1-bld-` | 5/7/9/11/13/15/17/19/21/23/25/27 | assign HIL |
| `cold-t14p4-f0p1-prism-only` | `batch1-bld-` | 5/7/9/11/13/15/17/19/21/23/25/27 | assign HIL |
| `history-static-t6-m1` | `batch1-hil-` | 5/9/13/17/21/25 | none |
| `history-static-t6-nodip` | `batch1-hil-` | 5/9/13/17/21/25 | none |

Shared settings: N64, dx 0.35 um, seed radius/thickness 2/1, pressure 101325 Pa, fill CFL 0.05,
20000 maximum completed updates, aggregate-v6, monopole-matched hexPrism, counter PRNG seed one,
noise zero, residual/divergence tolerances 1e-9/1e-7, maximum relaxation sweeps 200000. Target 29
is a 9.8 um maximum center span. Existing `phase6SigmaWaterFromTable(tempC) * fraction` supplies
supersaturation without a new fit. History and static rows use fraction 0.15 and ordinary M1 or
M1_NO_DIP_ABLATION. The four histories have one existing extent-triggered event (7 or 15), in
the named direction between -6 and -14.4 C. Cold rows stay at -14.4 C / fraction 0.10 with M1
base metadata and the named `experimentalFacetDips` arm. Never combine facet experiments with
timeline events. All observations use the existing spatial snapshot writer.

Size, step-cap, contact, stalled growth, convergence failure and resource interruption retain
their existing distinct dispositions. Only checked size endpoints count as completed targets;
other dispositions do not establish absence of a scientific effect. No production wall deadline.

## Why these comparisons, and readout

The completed [eight-row supplement](hil-supplement.md) motivates longer no-dip histories.
Internal saved-data triage is primary `out/next-hil-design-2026-10-10/supplement-triage.json`
(SHA-256 `eb95da47fa726317942a99cf8e48d6c6e572123e109bd4ea6a7c5334cc935df0`). It reuses existing
geometry, time-bracketing and row checks. Its matched history prefixes agree through the earlier
target, but the later cooling window changes the earlier short-window interpretation of new axial
growth. This is selection triage, not the completed registered supplement interpretation. The
pressure ordering survives the two tested timesteps at terminal size while trajectories still
differ at common age; further pressure rows are not needed merely to fill slots.

Use the existing [saved-data follow-up definitions](../../evidence/hil-bld-joint-review-2026-10-08/followup/README.md).
History compares M1/no-dip and switch-7/switch-15 at common elapsed physical times after their
actual event boundaries. Trigger-cycle attachments belong to the starting state. Report axial,
lateral and occupied-cell additions, separate early/later windows, and adjacent-event brackets.
The completed M1 supplement at fixed `7ea2582` supplies the longer paired controls; before analysis
verify new-producer scientific source parity and the retained common trajectory prefix. Ordinary
no-dip histories remain coupled to inherited geometry, fill and vapor state; contrasts do not
identify physical causality. Static -6 controls support only overlapping observed durations.

Cold: the prior first-batch sampling missed some prism-bearing stages. Dense odd extent crossings
use existing observations to inspect their vapor, alphaHK and kinetic-demand fields. Compare all
four new arms at common tip stages and separately physical plateau ages, using existing integer
core/tip radii and ring occupancy definitions. Snapshots need not match time or geometry between
arms; absence of sampled prism cells can still be an observation gap. The old BLD producer is a
design reference until source compatibility is established; the new quartet is internally matched
under one HIL producer. One/two-cell structural findings do not establish domain/grid independence.

## Execution, known failures and smallest implementation

Reuse `runNamedDiscoveryBatch`, `launchDiscoveryRows`, the campaign lease, pending-row selection,
memory guards, completed-cycle state and checkpoint codec. Extract only the existing supplement's
operational coordinator into a shared helper, preserving its exports, default behavior and receipt
identity. Bind the new finite roster through a thin entry. Do not add a scheduler or change the
scientific worker, readout, snapshot writer, result checker, checkpoint codec or ordinary CLI.

Rule 14A: accidental wrong-row/source continuation or simultaneous writers can corrupt scientific
state. Existing leases, row codecs, pending selection and source/runtime/host/roster bindings cover
these nearest boundaries. The small extraction avoids duplicating those controls for another
named budget; test that both callers retain their exact binding and worker route. This costs a
small focused check and introduces no hostile-owner defense or additional assurance layer.

Concurrency is ten new workers plus four warm workers: fourteen, within HIL's existing operational
ceiling of sixteen. This is a bounded operational choice, not a new throughput qualification.
At `2026-10-10T18:29:43.3955127Z`, the warm resource log records 49563279360 available physical
bytes and 57610838016 commit-headroom bytes with all four workers live; the retained snapshot is
task `out/hil-exploration-oct10-control/warm-before-launch.json`.
Existing N64 checkpointing campaigns and current host headroom justify starting without another
speed ladder. Both coordinators keep host-global guards of 12 GiB available RAM and 8 GiB commit
headroom. Inspect actual resource logs before launch; shared cache/bandwidth slowdown is unmeasured.

Checkpoints are written at each completed update, retaining two generations. Recovery repeats
only an unfinished relaxation. The existing real N64 pause/resume proof under ADR 0060 applies
because state construction, codec and production worker remain unchanged. Do not repeat it solely
for a new roster. Relevant lessons: C2/C3 (sound diagnostics and matched controls), C6 (computable
registered readouts), E5 (software interventions do not establish physical causality), and F2
(deliver the experiment before expanding process). Reread these before launch/readout. Existing
queue/lease/resume tests cover accidental recovery mistakes, not future scientific judgment.

From the fixed execution checkout:

```powershell
$env:PSModulePath=Join-Path $env:SystemRoot 'System32/WindowsPowerShell/v1.0/Modules'
node runner/src/hil-exploration-oct10-main.ts launch HIL out/hil-exploration-oct10
node runner/src/hil-exploration-oct10-main.ts resume HIL out/hil-exploration-oct10
node runner/src/hil-exploration-oct10-main.ts summarize out/hil-exploration-oct10
```

Use hidden background PowerShell helpers with process-only `-ExecutionPolicy Bypass`; the host's
default script policy otherwise refuses the helper. Set the Windows module path above for the
resource counter import. Keep unique coordinator stdout/stderr, invocation and real exit receipts.
The exact-target stop helper must only stop this campaign's coordinator and workers. Freeze this
checkout after launch and make later live-state updates in primary. No warm-worker intervention.

## Verification, sources and retention

Rule 6 scope is isolated row registration and batch orchestration. Scientific calculation,
readout/claim logic, evidence validators, codecs, solver and root test configuration are unchanged.
Required: focused new-roster/CLI/binding tests, existing supplement and queue/resume tests, both
typechecks (`npm.cmd run typecheck`), Rule 7 lint and applicable progress/diff checks. One bounded
shared-context review after interfaces stabilize. No app build, full solver suite, gate, capacity
ladder or new pause differential is required for this unchanged scientific surface. Escalate the
verification tier if implementation exceeds these exclusions.

Source currency checked 2026-10-10 before this freeze: official histories for
[TAX2](https://arxiv.org/abs/2306.13087), [CM9](https://arxiv.org/abs/2011.02353),
[CM4](https://arxiv.org/abs/1512.03389) and the
[author publication list](https://www.its.caltech.edu/~atomic/publist/kglpub.htm) show no superseding
growth source in this bounded check. No adopted parameter changes are proposed.

Git holds protocol, source and concise run receipts. Useful bulk outputs stay local until governed
NAS publication and fresh-restore verification under Rule 15 / ADR 0061; keep all three execution
worktrees open until their coverage is recorded. No cleanup or local pruning is authorized here.

## Implementation and verification — 2026-10-10

Protocol commit `85a2f6d` preceded implementation. The finite roster and thin entry reuse the
supplement coordinator extracted to `hil-operational-batch-main.ts`; the old supplement's exports,
binding and operational behavior remain intact. Numerical worker, queue, readout and resume-state
code are unchanged. `npx.cmd vitest run runner/test/hil-exploration-oct10.test.ts runner/test/hil-supplement.test.ts runner/test/hil-bld-batch-execution.test.ts runner/test/hil-bld-batch-resume.test.ts`
passed four files / 25 tests, exit zero (8.31 s). `npm.cmd run typecheck` passed both typechecks,
exit zero. Exact invocation/result/log files use prefixes
`focused-implementation-20261010T183212388` and `typecheck-implementation-20261010T183212553` under
task `out/hil-exploration-oct10-control/`, with copies in
`evidence/hil-exploration-2026-10-10/`. No full-suite-green claim is made.

One Codex/GPT-6 review with shared context found no blocker. It independently compared all ten
rows against retained first-batch `spec.json` files, checked the original supplement binding and
confirmed no numerical/readout/resume/queue changes. It did not repeat the implementation tests,
execute production/start/stop, or establish physical validity. Its limits and exact checks are in
`evidence/hil-exploration-2026-10-10/bounded-review.json`.

Task `out/hil-exploration-oct10-control/start-hil.ps1` launches or resumes this campaign; the sibling
`stop-hil.ps1` targets its exact entry/campaign paths and preserves checkpoint files. These helper
bytes are also retained in the evidence folder. Stop/resume commands from the fixed task checkout:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File out/hil-exploration-oct10-control/stop-hil.ps1
powershell.exe -NoProfile -ExecutionPolicy Bypass -File out/hil-exploration-oct10-control/start-hil.ps1 -Mode resume
```

## Launched — 2026-10-10

Producer `33832e20a386c52d830e2dd338a1f8671a25db8f` is committed and pushed on main. Keep this
execution branch and checkout fixed there; these later live-state notes are written in primary.
The hidden dispatcher started at `2026-10-10T18:35:11.3838261Z` (11:35 PDT); coordinator PID
21384 started all ten rows through the command recorded in task
`out/hil-exploration-oct10/hil-exploration-oct10-HIL-initial-launch.json` and each row's
`process.json`. The wrapper is `out/hil-exploration-oct10-control/start-hil.ps1 -Mode launch`,
invoked with `powershell.exe -NoProfile -ExecutionPolicy Bypass -File` through hidden Start-Process.

The startup observation at `2026-10-10T18:36:31.8033724Z` is retained in
`evidence/hil-exploration-2026-10-10/launch-verification.json`: ten live new workers, all beyond
the first completed update with current/previous checkpoint pointers, all ten row stderr files
and coordinator stderr empty. All fourteen worker CPU clocks advanced over the five-second
observation, including the four original warm PIDs. The new campaign's resource sample reports
48311791616 available physical bytes. No new row is claimed complete, and no runtime ETA follows
from these startup measurements.

Exact coordinator logs: task
`out/hil-exploration-oct10-control/campaign-launch-20261010T113511594.stdout.log` and sibling
`.stderr.log`; the wrapper will write the matching `-exit.json` on real completion. Row logs are
`out/hil-exploration-oct10/rows/<row-id>/attempts/initial/{stdout,stderr}.log`, with separate exit
records on termination. Checkpoints are under each row's `resume/`; live resource observations
are `out/hil-exploration-oct10/hil-exploration-oct10-HIL-initial-resources.jsonl`. Use the exact
stop/resume commands above if interrupted. No capacity probe or production wall deadline was added.

Prelaunch metadata checks passed `runner/test/evidence-integrity.test.ts` and
`runner/test/progress-index.test.ts`: two files / 18 tests, exit zero; Rule 7 passed. Their live
receipts are task `out/hil-exploration-oct10-control/metadata-prelaunch{.log,-result.json}` and
`rule7-final.log`. After recording startup in primary, the same two metadata files passed again
(18 tests, exit zero), and Rule 7 passed; primary `out/next-hil-design-2026-10-10/postlaunch-{metadata,rule7}{.log,-result.json}` retains these exact executions.
Raw captured evidence keeps its CRLF bytes; the scoped whitespace check treats
CR at end-of-line correctly and excludes only the two preserved implementation stdout logs.
Next: inspect live processes/checkpoints and actual terminal dispositions, then perform the
registered comparisons. Keep warm, supplement and new exploration output worktrees open until
governed NAS publication and fresh recovery cover their useful bytes.

## Steps

- [x] Select and commit these ten rows before implementation.
- [x] Add finite roster and shared operational entry; complete focused checks and bounded review.
- [x] Commit/publish producer, launch ten workers and record actual checkpoints/logs/recovery.
- [ ] Reconcile terminal dispositions, run the registered matched readouts and preserve outputs.

## Tried and rejected

- Duplicate -14.4 C / fraction 0.15 static target-29 pair: September confirmation already completed
  `confirm-topology-cfl-t14p4-f0p15-{m1,nodip}`. Use retained compatible results when needed.
- More pressure rows for occupancy: completed supplement already addresses timestep sensitivity;
  finish its matched analysis before allocating another pressure grid.
- Additional seed/facet hybrids now: existing ordinary controls require recovery/configuration
  reconciliation, including differing CFL values. Defer rather than launch unmatched comparisons.
- Another capacity ladder or arbitrary run deadline: unchanged N64 operation and live guards
  suffice for this operational budget; the maker requires recovery to target without a wall limit.

## Open questions

No maker decision blocks launch. Whether longer no-dip histories preserve incremental memory and
whether cold core catch-up changes at later stages remain the questions these runs must answer.
