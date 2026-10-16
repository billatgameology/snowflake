# Plan — HIL two-day exploration

- **Phase:** active Phase 10 model development; charter sections 2.5 and 3.2, accepted ADRs 0011, 0055, 0060 and 0062.
- **Status:** 187/192 checked endpoints, four interrupted rows resumed and advancing, one solver failure held; fixed producer 0161a51. Four warm continuations also restarted October 14.
- **Started / last touched:** 2026-10-12 / 2026-10-14 by Codex/GPT-6.
- **Authority:** maker chose to keep the four warm runs active and requested useful parallel exploration for roughly the next two days. After reviewing the 192-case scope and 43/54-hour planning scenarios, the maker directed “proceed with new wave.”

## Goal and done when

Solo scientific research; hostile actors excluded. Select a finite, useful queue beside the four
warm workers using completed October 11 results and actual execution costs. This proposal's
deliverable is 192 explicitly defined comparisons with a reproducible planning estimate and
known limits. The shortest meaningful check is row-count/operand reconciliation against the
completed controls and a calculation from recorded attempt durations; no simulation is needed
to make this selection. It does not complete the Phase 10 milestone, whose criterion remains:

> Done when the maker accepts multiple distinct promising model-development leads, each supported by a named matched comparison, a result with its scope and uncertainty, the numerical, representation and observation checks relevant to that result (or a specifically recorded unresolved check), and a concrete next discriminating experiment. Repeated configurations of one effect do not count as separate leads. Current candidates do not close the phase automatically; the maker's portfolio review decides when enough leads are promising. This criterion creates no automatic gate or quantitative-validation label.

## Registered finite comparisons

Each table row is its own Cartesian product. Four facet arms means both, neither, basal-only and
prism-only under explicit experimental identity; ordinary preparations means M1 and
M1_NO_DIP_ABLATION. Fraction means the existing water-saturation-table multiplier, not absolute
supersaturation. Every new row gets a new identity and output directory; completed rows stay frozen.

| Block | Exact operands | New rows | Question |
|---|---|---:|---|
| Cold tail | T = -17.5/-18.5/-19.5/-20.5 C; fractions 0.10/0.15/0.20; four facet arms; CFL 0.05 | 48 | Where does the sampled core/tip contrast disappear or return as forcing changes? |
| Cold forcing and timestep | T = -20 C; fraction 0.125 at CFL 0.05; fractions 0.10/0.125/0.15 at CFL 0.025; four arms | 16 | Does the forcing-sensitive one-cell contrast survive a smaller fill step? |
| Seed response | T = -6.5/-9.5 C at fractions 0.10/0.20, plus T = -7.5/-8.5 C at fraction 0.15; seeds radius/thickness 3/1 and 1/5; four arms; CFL 0.05 | 48 | How do forcing and temperature change the dependence of new axial/lateral growth on the starting seed? |
| History timestep | Both directions -6 to -14.4 C; fractions 0.10/0.20; switch extents 7/11/15; both ordinary preparations; CFL 0.025 = 24 histories. Add both temperatures x both fractions x both preparations = 8 statics | 32 | Do later-growth equalization and switch-stage contrasts survive smaller updates? |
| Pressure and history | Both directions -6 to -14.4 C; fractions 0.10/0.20; switch extents 7/15; both ordinary preparations; pressures 50662.5/202650 Pa; CFL 0.05 = 32 histories. Add both temperatures x both fractions x both preparations x both pressures = 16 statics | 48 | Does transport pressure change growth after an environment change? |

Total **192**. Shared N64, dx 0.35 um, maximum extent **29** (9.8 um maximum center span),
maximum 20000 completed updates, seed 2/1 except the seed block, pressure 101325 Pa except the
pressure block, aggregate-v6 / monopole-matched / hexPrism, PRNG seed one and zero noise.
Retain residual/divergence tolerances 1e-9/1e-7, 200000 maximum relaxation sweeps, dense odd
spatial crossings 5 through 27 and existing per-update records. Each ordinary history has exactly
one extent-triggered temperature change with its fraction retained. Never mix facet interventions
with environment events. Reuse existing controls only after source and scientific-prefix checks.

## Selection evidence and readout

Concise records are in `evidence/hil-two-day-design-2026-10-12/`; they bind the detailed calculations
under primary `out/hil-two-day-design-2026-10-12/` and the retained execution worktrees.

Cold: at tip eight and half the shortest common plateau, the -20 C contrast changes from gaps
0/0/0/0 at fraction 0.10 to 0/0/1/1 at 0.15, in neither/basal-only/prism-only/both order. Localize
this feature and test its timestep sensitivity. Compare integer core/tip radii and ring occupancy
at multiple shared tip stages, plateau ages and separately absolute physical ages, retaining
adjacent-event brackets. A one-cell difference is not a grid-independent finding.

Seed: the saved common-age comparisons identify basal-associated axial enhancement near -6.5 C
and prism-associated axial suppression near -9.5 C. Compare actual new axial/lateral spans and
occupied-cell additions, not inherited seed spans or terminal aspect ratio alone. These seeds
also differ in volume, surface and diffusion environment; their response does not isolate shape
as a physical cause. Do not reuse old CFL 0.1 seed rows as CFL 0.05 controls.

History: in the October 11 warming comparisons, later-half M1 axial additions agree across
switches 7/11/15 within each observed forcing window (10/10/10 lattice layers at fraction 0.10;
8/8/8 at 0.20). This does not mean all memory vanished: other quantities and stages differ.
Compare new axial/lateral/occupied-cell increments at common post-switch ages, separate early
and later windows, and retain adjacent-event brackets. Trigger-cycle attachments precede the
environment change. The new pressure block tests a history interaction; the prior static
pressure timestep comparison already preserved its forcing-dependent occupancy ordering.

Selection used existing event reconstruction, operational row checks and bracket definitions.
Codex/GPT-6 agents shared context; no independent physical validation, spatial-field review,
grid/domain qualification or full registered interpretation was completed. Eighteen ordinary
source-static history prefixes were checked equal; the six using experimental October 10
statics still require their registered compatibility checks before a complete readout claim.

## Explicit time and worker budget

The completed 102-row queue used **227.706 worker wall-hours** in **19.914 elapsed hours** with
twelve slots. Its observed occupied-slot fraction was 0.952895; this is not CPU utilization.
The selected budget uses each matching block's measured mean and the recorded CFL 0.025 cold
mean. History timestep cost is budgeted at **twice** the ordinary history/static
means; that factor is an assumption, not a measured history scaling law. Pressure-history costs
use ordinary history/static means and likewise remain uncertain under changed pressure.

The resulting estimate is **494.710 worker-hours / (12 x 0.952895) = 43.264 elapsed hours**.
A separately stated **25% slowdown scenario gives 54.080 hours**. These are planning scenarios,
not confidence bounds; new trajectories or uneven tails can take longer. The proposal targets
roughly two days, and does not promise completion within 48 hours. Exact inputs and formula are
in the selected-budget and operational-summary records. The maker sees this uncertainty before launch.

Use **twelve new workers plus the four continuing warm workers**, on HIL. The October 12 09:08
PDT observation found all four advancing, about 45.60 GiB available memory and 51.58 GiB commit
headroom. Retain existing 12 GiB available-RAM / 8 GiB commit guards; no new capacity ladder.
The old timing already includes four warm workers, but exact contention remains variable.
No BLD dispatch or increase above sixteen total workers is proposed.

At the first substantive progress review, compare completed block costs against these named
assumptions and state any expected overrun plainly. Do not quietly replace the estimate with
repeated "another day" claims. No automatic wall stop: scientific size targets, distinct failure
dispositions and completed-cycle resumability remain. Interleave matched groups so several
questions become reviewable early; do not expand the queue after launch without a new decision.

## Implementation, checks and retention after selection

Before implementation, commit the approved protocol and refresh its bounded source-currency
check. Inspect existing worktrees; preserve fixed producers and useful local output. Use one
new task checkout for this finite roster because the existing execution checkouts own frozen runs.
The only implementation needed is a finite roster, a thin `runHilOperationalBatch` entry and
focused roster/routing tests. Existing queue, leases, guards, numerical worker, observations,
readouts and discovery-resume-v1 state stay unchanged. Register exact launch/pause/resume
commands and separate coordinator/worker stdout/stderr/exit paths before starting workers.

Rule 14A: accidental wrong roster/source or duplicate writers can corrupt results; existing
identity, lease and resume checks already address that boundary. No new infrastructure is needed.
Lessons C2/C3/C6 and E5 govern matched readouts; the October 12 warm planning gap governs cost
communication. Checks do not remove the need for interpretation judgment.

For the isolated roster/orchestration surface, use focused roster/queue/resume tests, both
typechecks, Rule 7 and applicable metadata checks, plus one bounded review. Escalate Rule 6 only
if scientific calculation, readout or state behavior changes. The existing real N64 pause/resume
witness applies while that contract stays unchanged. Preserve current and previous completed
cycle generations; an interrupted relaxation may be replayed. No old checkpoint target extension.

Bulk outputs stay local during execution and then follow Rule 15 / ADRs 0051 and 0061 for governed
NAS publication and fresh recovery before checkout closure. Git stores concise records and code.
No output pruning or closure is part of selecting this batch.

## Steps

Proposal-record verification: `npx.cmd vitest run runner/test/evidence-integrity.test.ts
runner/test/progress-index.test.ts` passed 18 tests, exit zero; `npm.cmd run lint:rule7` passed,
exit zero. Logs are primary `out/hil-two-day-design-2026-10-12/{metadata-check,rule7-check}.log`.
The scoped diff check passed. These are metadata/prose checks, not implementation qualification
or a scientific-gate result; no solver or capacity run was performed.

- [x] Read completed results and recorded cost; select exact finite comparisons and timing scenarios.
- [x] Maker approved the 192-case scope and explicit timing uncertainty.
- [x] Commit approved protocol, implement the small roster/entry and complete launch checks.
- [x] Publish fixed producer and record the real launch.
- [x] Launch twelve new workers, verify actual checkpoints and preserve the four warm workers.
- [ ] Reconcile terminal dispositions, execute registered readouts and preserve results on NAS.

## Out of scope

N126/grid refinement, larger targets, new physical laws, new source acquisition, experimental
facet/history mixing, GPU or Phase 7 work, gate/validation claims, automatic fan-out and BLD dispatch.

## Tried and rejected

- Fill 48 hours by repeating arbitrary settings: select matched questions from completed data instead.
- Another static pressure grid: its timestep question has already been addressed; the selected
  pressure block asks a new interaction with environment history and carries its own controls.
- Larger/finer cases on the N64 cost estimate: the warm run illustrates why that extrapolation fails.
- Arbitrary 48-hour termination: checkpoint recovery preserves finite scientific targets.
- Extra flank-temperature histories (-5/-12 and -8/-16) remain an unselected option. The chosen
  timestep and pressure interactions have clearer immediate discriminatory value.

## Open question

The maker approved the finite scope and its explicit timing uncertainty. No maker decision
blocks launch; actual duration and scientific findings remain to be measured. Warm workers continue.

## Launch protocol frozen — 2026-10-12

Branch `codex/hil-two-day-oct12`, checkout
`C:/Users/biao3/.codex/worktrees/hil-two-day-oct12/snowflake`, starts at `825c9d1`.
The other four execution checkouts retain their fixed producers and useful outputs. Live state
after launch is written in primary, keeping this executing source clean and fixed.

New IDs use `oct12-hil-` and identify block, temperature, fraction, event/seed/pressure and CFL
where applicable. Preserve complete facet quartet order both/neither/basal-only/prism-only and
ordinary pair order m1/nodip. Interleave groups in this order: cold tail, seed, history timestep,
history timestep static, pressure history, pressure static, cold forcing/timestep; repeat until
all groups are queued. No conditions are selected dynamically after results arrive.

The frozen source-currency check on October 12 reopened the official version histories for
[TAX2](https://arxiv.org/abs/2306.13087) (v1),
[CM9](https://arxiv.org/abs/2011.02353) (v1), and
[CM4](https://arxiv.org/abs/1512.03389) (v2), and the
[author publication list](https://www.its.caltech.edu/~atomic/publist/kglpub.htm).
No superseding growth source was identified in this bounded refresh relative to the October 11
check; the later listed 2025 items concern teaching-lab experiments. No adopted parameter,
interpolation, physical model or source claim changes.

From the fixed checkout, after setting the process-only Windows module path:

```powershell
$env:PSModulePath=Join-Path $env:SystemRoot 'System32/WindowsPowerShell/v1.0/Modules'
node runner/src/hil-two-day-oct12-main.ts launch HIL out/hil-two-day-oct12
node runner/src/hil-two-day-oct12-main.ts resume HIL out/hil-two-day-oct12
node runner/src/hil-two-day-oct12-main.ts summarize out/hil-two-day-oct12
powershell.exe -NoProfile -ExecutionPolicy Bypass -File out/hil-two-day-oct12-control/stop-hil.ps1
powershell.exe -NoProfile -ExecutionPolicy Bypass -File out/hil-two-day-oct12-control/start-hil.ps1 -Mode resume
```

Use the existing exact-path hidden wrapper pattern with fresh coordinator stdout/stderr, invocation
and actual-exit receipts. Per-row attempt logs are `out/hil-two-day-oct12/rows/<id>/attempts/initial/`;
restart state is under each row's `resume/`. Stop targets only this campaign, never warm workers.
Launch is done when focused checks and both typechecks pass, one bounded non-author review has no
unresolved claim-changing issue, twelve workers have completed-cycle checkpoints, and all four
warm CPU clocks still advance. Endpoints and the registered scientific readout come later.

## Implementation checks — 2026-10-12

Protocol `2da7eae` preceded implementation. Only the finite roster, thin entry and focused test
were added; no numerical worker, observer/readout, queue, codec or solver was changed.
`npx.cmd vitest run runner/test/hil-two-day-oct12.test.ts runner/test/hil-large-batch-oct11.test.ts runner/test/hil-exploration-oct10.test.ts runner/test/hil-supplement.test.ts runner/test/hil-bld-batch-execution.test.ts runner/test/hil-bld-batch-resume.test.ts`
passed six files / 33 tests, exit zero. `npm.cmd run typecheck` passed both TypeScript checks,
exit zero. Exact logs and real exit receipts are retained under
`evidence/hil-two-day-oct12-2026-10-12/` with focused-implementation/typecheck-implementation names.
These checks cover the roster and unchanged runner boundaries; no full-suite or scientific-gate
result is claimed. The bounded non-author review found no unresolved blocker.

Locked dependencies were installed locally with unchanged lockfile; workspace links target this
checkout. Existing exact-path start/stop helpers were adapted and parsed with zero syntax errors,
without executing stop or production. Helper bytes and preparation/host/worktree-inventory
receipts are in the same evidence directory. The four previous execution checkouts remain fixed
and own useful output; primary owns its preserved analysis and retired output. This new task
contains only included source/records plus local dependencies, control logs and future campaign
staging. No output-owning checkout or branch is removed.

One Codex/GPT-6 non-author review with shared context independently reconstructed all 192 row
objects and their interleave: 56 ordinary histories, 24 statics and 112 constant-environment
experimental rows; all scientific signatures unique and no exact October 11 repeats. It confirmed
unchanged scientific/runtime files, twelve-worker binding and helper byte/syntax parity. It did
not rerun tests, simulate, execute stop or qualify physical/grid/domain claims. Exact scope and
limits are in `evidence/hil-two-day-oct12-2026-10-12/bounded-review.json`.

Prelaunch evidence-integrity and progress-index checks passed 18 tests, exit zero; Rule 7 passed.
Exact commands/logs/exits are task `out/hil-two-day-oct12-control/metadata-prelaunch{.log,-result.json}`
and `rule7-prelaunch{.log,-result.json}`. Scoped diff check passed with CR-at-EOL recognized,
excluding preserved raw stdout logs from whitespace lint. All producer code stayed unchanged
after focused checks; the review's nonblocking stale approval question was corrected in prose.

## Launched — 2026-10-12

Producer `0161a5126ea47d565db7d6534ed7b56c743c0ffc` is committed and pushed on main.
Keep branch `codex/hil-two-day-oct12` and its execution checkout fixed there. Later status
records are made in primary. Hidden wrapper PID 26680 dispatched at
`2026-10-12T16:39:51.5075953Z` (09:39 PDT) through
`powershell.exe -NoProfile -ExecutionPolicy Bypass -File C:/Users/biao3/.codex/worktrees/hil-two-day-oct12/snowflake/out/hil-two-day-oct12-control/start-hil.ps1 -Mode launch`.
Task `out/hil-two-day-oct12-control/dispatch-20261012T163951487Z.json` records the exact
command, source and separate dispatch stdout/stderr. The wrapper records coordinator invocation,
logs and eventual real exit under `campaign-launch-*` in that control directory.

The [startup observation](../../evidence/hil-two-day-oct12-2026-10-12/launch-verification.json)
at `2026-10-12T16:41:51.8311474Z` (09:41 PDT) records twelve live new workers, 180 rows
awaiting slots and all four original warm workers live. All sixteen CPU clocks advanced.
All twelve new rows have current and previous completed-cycle checkpoints: eight at updates
21/20 and four at 41/40. Their metadata reports converged relaxations and no integrity errors;
worker and coordinator stderr files are empty. No terminal result or exit is present yet.
This is an operational observation, not a payload rehash, new semantic resume proof or a
completed scientific endpoint. No warm worker was stopped or restarted.

Coordinator PID 24256 and wrapper PID 26680 were live. Exact coordinator logs are
`out/hil-two-day-oct12-control/campaign-launch-20261012T093951726.stdout.log` and
`out/hil-two-day-oct12-control/campaign-launch-20261012T093951726.stderr.log`; the sibling
`-invocation.json` binds the actual command, while `-exit.json` appears only on real exit.
Each row retains its separate attempt logs and `resume/latest.json` with two generations.
Use the resume command above only after confirming the existing coordinator and workers exited.

Next: inspect terminal dispositions with the registered `summarize` command, compare actual
block costs with the explicit timing assumptions, then execute matched readouts and publish
bulk results to NAS before any checkout closure. Five output-owning execution checkouts remain
open; their source stays fixed and their useful local payloads are retained.

Postlaunch record checks: `npx.cmd vitest run runner/test/evidence-integrity.test.ts
runner/test/progress-index.test.ts` passed 18 tests, exit zero; `npm.cmd run lint:rule7`
passed, exit zero. Exact command/time/exit receipts and unique logs are primary
`out/hil-two-day-design-2026-10-12/postlaunch-{metadata,rule7}{.log,-result.json}`.
Scoped staged whitespace check passed. Prepublication worktree inspection found all five
execution checkouts clean at their fixed producers; their ignored output remains independently
owned and retained. Primary includes only this status, the plan and the pinned startup receipt.

## Evening status — 2026-10-12

At 18:40 PDT, the [wave observation](../../evidence/hil-two-day-oct12-2026-10-12/status-evening-wave.json)
rederived 39 size endpoints using the existing `summarizeFirstBatchRow` on terminal rows only:
zero invalid/failed rows, twelve live workers and 141 queued. Counts by registered block are
cold tail 10/48, cold forcing/timestep 6/16, seed 8/48, history timestep 7/32 and pressure/history 8/48.
All twelve live rows have current/previous completed-cycle checkpoints with converged metadata,
no integrity errors, advancing CPU and empty stderr; coordinator 24256 is live without errors.
This is operational endpoint checking, not a matched scientific interpretation.

After 9.012 elapsed hours, completed rows consumed 87.751 worker-hours versus 99.334 budgeted
for those same rows. The block actual/budget worker-hours are cold tail 18.252/20.867,
cold forcing/timestep 13.381/13.732, seed 17.845/17.302, history timestep 21.295/30.077 and
pressure/history 16.979/17.356. These are a selected completed prefix; remaining conditions
and active tails may differ. No new completion-time bound is established. Keep the original
43.264/54.080-hour scenarios explicit and compare again as later blocks finish.

The [18:39 warm observation](../../evidence/hil-two-day-oct12-2026-10-12/status-evening-warm.json)
records all four original workers advancing, with extents 43/39/41/41 against target 57,
in thin-broad/thin-early/thick-broad/thick-early order. Current updates are 1106/942/1018/951.
Current/previous checkpoint metadata reports convergence and no integrity errors; no terminal
results, attempt exits or stderr. This check neither restarts work nor establishes a warm ETA.
Both active producers remain clean and fixed. Next action remains the registered readout and
continued cost review, then governed NAS preservation before closing any output-owning checkout.

Status-record verification: evidence-integrity/progress-index checks passed 18 tests, Rule 7
and staged whitespace checks passed. Exact commands, exits and unique logs are primary
`out/status-2026-10-12-evening/{metadata-check,rule7-check}{.log,-result.json}`.

## Morning status — 2026-10-13

At 07:15 PDT, the [wave observation](../../evidence/hil-two-day-oct12-2026-10-12/status-2026-10-13-morning-wave.json)
rederived 102 size endpoints and one invalid solver-error result with the existing terminal-row
checker. Twelve workers remain live and 77 cases are queued. Completed blocks are cold tail
24/48, cold forcing/timestep 16/16, seed 23/48, history timestep 18/32 and pressure/history
21/48, with the failure in pressure/history. Active worker and coordinator stderr are empty;
all twelve active rows have converged current/previous checkpoint metadata, no recorded integrity
errors and advancing CPU. Empty stderr does not imply success: the failed row records its error
in `result.json` and exits nonzero.

Row `oct12-hil-pressure-history-t6-to-t14p4-f0p1-e15-p202650-m1` exited one at 00:19 PDT
with `solver-error`: aggregate boundary solve did not converge, cell 145376, `sigma_b 1e-323`
versus iterate zero. It had completed 414 updates at extent 21; generations 414/413 remain
with clean completed-cycle metadata. This is a near-zero numerical failure observation, not a
diagnosed cause or invalidation of every other case. Next: inspect the boundary iteration
and reproduce the saved failure in isolation before deciding a correction/rerun protocol.
Do not relax the convergence contract or modify the running producer; no retry was performed.

At 21.591 elapsed hours, successful completed cases consumed 242.455 worker-hours versus
264.586 budgeted for those same cases. The fully completed cold forcing/timestep block used
46.307 versus 40.658 worker-hours (13.9% above its estimate). Other completed blocks remain
below their corresponding budgets, but this selected prefix cannot bound remaining tails.
The original 43.264/54.080-hour scenarios remain provisional, and failure recovery is separate.

The [warm observation](../../evidence/hil-two-day-oct12-2026-10-12/status-2026-10-13-morning-warm.json)
at 07:15 PDT records extents 45/41/43/43 against 57 and updates 1223/1087/1141/1082, in
thin-broad/thin-early/thick-broad/thick-early order. Each grew two extent units since evening.
All four original workers and coordinator are live, CPU advances, checkpoint metadata converges
without recorded integrity errors, and no terminal results, exits or stderr are present.
Both execution producers remain clean and fixed. No pause, restart, capacity probe or new
simulation was performed for this operational status check. No reliable warm ETA is established.

Status-record checks passed: evidence-integrity/progress-index 18 tests, Rule 7 and staged
whitespace. Exact commands, real exits and unique logs are primary
`out/status-2026-10-13-morning/{metadata-check,rule7-check}{.log,-result.json}`.

## Reboot recovery protocol — 2026-10-14

The maker requested recovery after Windows Update restarted HIL. System event 1074 records
a planned OS-upgrade restart by TrustedInstaller on October 13 at 23:47/23:48 PDT; current
boot began at 23:48:30 PDT. Before recovery no scientific Node processes remain. The original
queue reached 187 independently checked size endpoints, one previously recorded solver failure
and four interrupted exits at 23:45 PDT. No unstarted cases remain. Primary
`out/reboot-recovery-2026-10-14/{host-before-resume,wave-preflight}.json` records this census.

Deliverable: continue exactly these four existing rows from their verified checkpoints, beside
the four warm continuations, using their fixed producers and unchanged scientific targets:

| Row | Saved update | Extent / target |
|---|---:|---:|
| `oct12-hil-history-step-t14p4-to-t6-f0p2-e15-cfl0p025-nodip` | 1227 | 23/29 |
| `oct12-hil-pressure-history-t14p4-to-t6-f0p1-e15-p202650-nodip` | 850 | 27/29 |
| `oct12-hil-pressure-history-t14p4-to-t6-f0p2-e15-p202650-nodip` | 421 | 17/29 |
| `oct12-hil-pressure-history-t14p4-to-t6-f0p2-e15-p50662p5-nodip` | 571 | 21/29 |

The existing full campaign validator and selected-row resume planner pass. Existing
`DiscoveryCheckpointStore.load()` verifies each checkpoint's bytes, strict decode, row/source/
runtime/host binding, event prefix and snapshots without invoking recovery mutation. All four
have converged completed-cycle metadata, no integrity errors and no terminal stop reason.
An interrupted relaxation is replayed; this does not restart growth from the seed.

The generic whole-campaign resume correctly refuses the known solver-error row. Use one small
operational helper in the fixed checkout, `out/hil-two-day-oct12-control/resume-reboot-oct14.mjs`,
that validates the complete campaign, acquires the existing campaign lease, selects only the four
rows above with `planFirstBatchResume`, requires four `resume-row` commands and reuses
`launchDiscoveryRows` with concurrency four, original entry, `resumeExistingRows: true` and
the existing memory monitor. No solver, codec, roster, checkpoint or failed result is edited.
The 187 completions and the failed case are excluded, not relabeled. Preserve new attempts and
the existing recovery-tail disposition, with unique invocation/stdout/stderr/exit records.

Rule 14A: accidental selection of the solver failure or a duplicate writer could corrupt the
recovery record; the existing campaign/row/lease/loader checks cover those boundaries. The only
missing operation is explicit selection of the four interrupted rows; reuse those checks rather
than build new infrastructure. Lessons A3/C1/D2 apply. This is solo scientific research with
hostile actors excluded. The shortest meaningful check is successful existing checkpoint
validation, helper syntax/selection review and observed advancement past all four saved ticks.
No new capacity probe, semantic resume experiment or scientific-code test suite is required.

Launch the exact-path hidden PowerShell wrapper
`powershell.exe -NoProfile -ExecutionPolicy Bypass -File out/hil-two-day-oct12-control/resume-reboot-oct14.ps1`
from the fixed checkout. Its Node helper receives original entry and campaign paths as explicit
arguments, preserving the existing `stop-hil.ps1` exact-path process selection. Actual recovery
is complete when all four restored rows advance and the four warm continuations are also live;
scientific endpoints and the held solver-failure diagnosis remain later work. No wall deadline.

### Executed recovery

The pinned [recovery bundle](../../evidence/hil-reboot-recovery-2026-10-14/wave-preflight.json)
retains the host restart receipt, existing-loader preflights and all 187 independently checked
terminal dispositions. The helper/wrapper copies and bounded shared-context Codex review
are retained beside those receipts. Restore the helper copies into their named fixed checkout's
`out/hil-two-day-oct12-control/` before using the exact recovery command above; never launch
a second writer while either existing coordinator is live.

Warm resumed at 15:53 PDT (coordinator 12464; workers 3000, 10660, 10896, 19620).
The wave resumed at 15:54 PDT (coordinator 344; workers 12472, 24708, 888, 12748),
attempt `reboot-1792018457227-f81d7616-dac3-45c0-8ea0-3cc8e30058f0`.
The [wave observation](../../evidence/hil-reboot-recovery-2026-10-14/wave-recovery-observation.json)
at 15:56 PDT records updates 1227→1241, 850→863, 421→434 and 571→585,
with extents 23/27/19/21 against target 29. The
[warm observation](../../evidence/hil-reboot-recovery-2026-10-14/warm-recovery-observation.json)
at 2026-10-14T22:59:14.001Z records updates 1383→1384, 1247→1248, 1297→1298, 1244→1245;
thin-t4p5-broad: extent 49, update 1384; thin-t4p5-early: extent 41, update 1248; thick-t4p5-broad: extent 45, update 1298; thick-t4p5-early: extent 43, update 1245. All eight have advancing CPU, new completed checkpoints, converged
metadata, no recorded integrity errors and empty stderr. Both fixed checkouts remain clean;
the held solver-error result has its unchanged pre-recovery hash. This completes operational
recovery, not the scientific endpoints or their interpretation.

Each observation records exact row stdout/stderr, attempt command, recovery receipt and resource
sample. Wave coordinator logs are in the fixed checkout at
`out/hil-two-day-oct12-control/campaign-reboot-resume-20261014T155416947.{stdout,stderr}.log`;
warm logs are in its fixed checkout at
`out/warm-refinement-control/reboot-resume-20261014T225308622Z.{stdout,stderr}.log`.
Real completion/exit receipts are produced by those live coordinators and wrappers when they end.
The previously completed eight-, ten- and 102-case batches remain local and unchanged.
Next: continue these eight rows, isolate the held numerical failure before any retry, and
execute matched readouts plus governed NAS preservation before closing output-owning checkouts.

Recovery-record checks passed: existing evidence-integrity/progress-index checks, 18 tests;
Rule 7; scoped staged whitespace. Exact command/time/exit receipts and unique logs are primary
`out/reboot-recovery-2026-10-14/{metadata-check,rule7-check,whitespace-check}{.log,-result.json}`.
These check recovery metadata and prose; no full-suite or new scientific gate result is claimed.

## Second reboot and maker-requested single retry — 2026-10-15

The four October 14 wave recoveries all reached extent 29, exit zero, with no errors from
the existing row checker. The recovery coordinator ended October 14 at 16:51:30 PDT;
`out/reboot-recovery-2026-10-15/wave-completion.json` retains those four checks. Combined
with the earlier 187 checked endpoints, this is 191 successes and the known solver failure.
Windows Update initiated another planned restart October 15 at 00:38 PDT, stopping the four
warm rows; same-producer checkpoint recovery uses the already accepted operational protocol.

The maker explicitly requested “let's also rerun the failed one.” This authorizes one isolated,
unchanged retry of `oct12-hil-pressure-history-t6-to-t14p4-f0p1-e15-p202650-m1` from its saved
completed update 414, extent 21, target 29. It supersedes the prior hold for this single attempt,
not the general refusal of automatic scientific-failure retries. The previous error was aggregate
boundary nonconvergence at cell 145376 (`sigma_b 1e-323` versus zero); the same deterministic
producer may reproduce it. Do not alter numerical tolerances, parameters, source or checkpoint.

Deliverable: one recorded retry with its actual terminal disposition, or verified continuation
beyond the failed cycle if it proceeds. Use the clean fixed producer `0161a51` and full campaign
validator, verify the exact registered row/spec and original failure hash, and load the saved state
through `DiscoveryCheckpointStore.load()` before launch. Keep the original result and exit in
the concise retry receipt; the existing recovery path also preserves them with any event tail.
Use the existing campaign/row leases and `launchDiscoveryRows` for one `resume-row` worker,
a unique `maker-retry-*` attempt, labeled logs and real exit, beside the four warm workers.
The generic selector correctly refuses the solver failure: this reviewed, maker-requested
one-row helper supplies that exact row directly to the unchanged worker. No automatic retry loop.

Rule 14A: accidental duplicate work or loss of the original failed result is the relevant risk;
existing leases, checkpoint validation, attempt logs and recovery preservation cover it. The
small explicit row selection is the only new seam. Lessons A3/C1/D2 and the existing completed-cycle
resume contract apply. This is solo scientific research; hostile actors are excluded. The shortest
check is the existing loader, helper syntax/selection review and recorded worker result. No new
capacity probe, numerical test suite, physical interpretation or convergence correction is included.
If the same failure returns, retain both attempts and leave numerical diagnosis as the next task.

Exact launch from the fixed checkout:
`powershell.exe -NoProfile -ExecutionPolicy Bypass -File out/hil-two-day-oct12-control/retry-held-oct15.ps1`.
