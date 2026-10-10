# Plan — HIL longer history and cold facet exploration

- **Phase:** post-Phase-10 model development under charter section 2.5 and accepted ADRs 0011, 0055 and 0060.
- **Status:** registered; implementation and launch pending.
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
Existing N64 checkpointing campaigns and current host headroom justify starting without another
speed ladder. Both coordinators keep host-global guards of 12 GiB available RAM and 8 GiB commit
headroom. Inspect actual resource logs before launch; shared cache/bandwidth slowdown is unmeasured.

Checkpoints are written at each completed update, retaining two generations. Recovery repeats
only an unfinished relaxation. The existing real N64 pause/resume proof under ADR 0060 applies
because state construction, codec and production worker remain unchanged. Do not repeat it solely
for a new roster. Relevant lessons: C2/C3 (stage and matched controls), C6 (scope of comparisons),
E5/F2 (resume and live process evidence); reread their governing contracts before launch/readout.
Existing queue/lease/resume tests cover accidental recovery mistakes, not future scientific judgment.

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

## Steps

- [x] Select and commit these ten rows before implementation.
- [ ] Add finite roster and shared operational entry; complete focused checks and bounded review.
- [ ] Commit/publish producer, launch ten workers and record actual checkpoints/logs/recovery.
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
