# HIL / BLD first exploration batch

- **Scope:** executable first stage of the maker-approved post-Phase-10 portfolio; development evidence only.
- **Status:** resumable producer published at `b9cf7ed`; HIL's replacement queue ended with 50 size endpoints and six checkpoint I/O failures. Original HIL is stopped and preserved at `f4ca38a`. BLD state requires inspection on that computer.
- **Implementation branch / destination:** `codex/discovery-resume` -> `origin/main`; original `science/hil-bld-first-batch` is reconciled.
- **Authority:** [adaptive discovery](post-phase10-adaptive-discovery.md#exploration-portfolio-for-hil-and-bld), accepted ADRs 0055-0059, attachment-kinetics specification. No phase gate changes.

## Goal and done when

BLD can pull one tested producer, select its named workload, measure its local resource budget,
and launch a finite queue without needing HIL to design another protocol. HIL has the equivalent
commands for its own queue. This milestone has no charter phase done-when; completion requires
all named rows selectable, bounded execution and resource checks exercised, focused negative
controls and exact `npm test` passing, and shared code published. Scientific results follow the
maker's dispatch; this implementation session does not start the full campaign.

## Resumable rerun: maker direction 2026-10-07

Implementation: `codex/discovery-resume` in primary's `.tmp-discovery-resume/` worktree.
The retained original execution checkout is separate and receives no source edits.

The maker explicitly requires: stop the current run, make it resumable without the four-hour
limit, then rerun. This supersedes the non-resumable terminal-stage choice below, not the
registered scientific rows, observations, numerical controls or scientific endpoint/adequacy rules.
There is no charter phase done-when for this operational extension. The concrete deliverable is
HIL executing the same named workload with working fresh-process continuation and no elapsed-time
termination; BLD receives the same tested source and explicit commands.

**Done when:** all registered row families support checkpoint/restore with unchanged scientific
state and continuation; interrupted and uninterrupted witnesses agree in fields, ordered topology,
events, snapshots, timeline transitions and numerical metrics (excluding declared operational time,
RSS and process metadata); corruption and incompatible row/source/runtime are refused; a real N64
worker is interrupted and continued in a fresh process; exact `npm.cmd test` passes at a stable
checkpoint; shared code is published and HIL is rerun from its seeds under the new protocol.

Approach and sequence:

1. Preserve the original execution worktree and observations. HIL was stopped at
   `2026-10-08T04:27:33.5093531Z`; primary
   `out/hil-manual-stop-20261007T212733/stop-receipt.json` and `owned-processes-before.json`
   record the exact owned processes. The post-stop process query found no matching launcher or
   workers. Abruptly stopped observations are not checkpoint state and cannot be upgraded retroactively.
2. Commit this amendment and decision 0060 before implementation in one isolated implementation
   checkout. The new discovery-only format supports ordinary M1/no-dip including the registered
   single environment event, the four facet arms, and full/early width modes. Preserve all historical
   formats/refusals and experiment identities; proposed 0039's Phase 6 production machinery stays deferred.
3. Reuse the existing complete-cycle solver state and row producer. Publish a checkpoint initially
   and after every completed cycle (including any just-fired environment event), using temporary
   files and atomic publication of a complete generation; retain the previous complete generation.
   Bind exact row/source/Node/V8, solver state, runner accumulators, event-prefix bytes and snapshots.
   Resume rolls observations back to that committed boundary, preserving discarded tails separately,
   and repeats only unfinished work. A partial relaxation never becomes a completed event.
4. Add explicit batch/row resume commands using the original campaign directory; retain attempt-specific
   process logs/exits. Completed valid rows are skipped, unfinished rows restore their latest complete
   checkpoint, and an unstarted row begins from its seed. A partial checkpoint never replaces the last
   good generation. No automatic restart loop hides solver or evidence failures.
5. Remove the production four-hour worker/parent timers. Keep the short resource-probe timeout and
   live memory protection. Retain scientific size/contact/convergence/stall and existing update-cap
   meanings; a step cap remains unresolved. Checkpointing makes subsequent continuation possible,
   while extending a registered scientific observation window remains an explicit protocol decision.
6. Use focused differential/negative controls while implementing; then one bounded review after the
   interfaces stabilize, exact `npm.cmd test`, and a real N64 process interruption/continuation witness.
   Requalify the changed producer on HIL and rerun into a new output directory. Record exact launch,
   checkpoint cadence and resume command before dispatch. Publish instructions for BLD to perform its
   own qualification and restart with the same producer.

Rule 14A scope: plausible failures are interruption during checkpoint publication, stale observation
tails, missing experimental/history state, wrong-row continuation and duplicate event application.
These can change scientific trajectories or corrupt their evidence. Existing v3 rejects these rows,
and observations omit evolution fields; nearest-boundary state/row tests and atomic checkpoint I/O
address those gaps directly. Their cost is lower than rerunning long experiments. This is solo
scientific research; hostile repository/runtime control stays excluded. No new transport, dashboard,
registry, gate framework or Phase 6 evidence machinery is needed.

Relevant lessons: A3 (concurrent writers overwrite evidence) requires one row writer and an explicit
committed prefix; E4 (reachable boundary fill exactly one) requires the existing state witness and
history-aware report absence after an environment event; F1/F2 require returning to the usable
pause/continue path before expanding process. Existing core/solver resume and timeline tests are
the starting seams. New tests cover first-batch modes and actual subprocess recovery. Bitwise
continuation is scoped to the pinned Node/V8 oracle; operational time and RSS are not deterministic.

Out of scope: recovering absent state from the stopped original processes; changing physical inputs,
solver equations, scientific targets or held-out/phase status; experimental facet/width plus environment
events; geometric-completion ablations; GPU resume; remote control of BLD; generic scheduling services.

Implementation checkpoint: the separate core codec and solver adoption, row generation publication,
observation-tail recovery and explicit batch resume are implemented. The initial synchronous format
is bounded to 64^3 cells / 64 MiB encoded bytes, covering this entire N64 roster; larger-domain
continuation requires its own measured extension. Old v3 eligibility and numerical evolution remain
unchanged. Resource probes now exercise checkpoint creation too, with only their parent watchdog.

Commands for the replacement campaign (from its clean, fixed execution checkout):

```powershell
node runner/src/hil-bld-batch-main.ts probe HIL out/batch1-hil-resumable-probe
node runner/src/hil-bld-batch-main.ts launch HIL out/batch1-hil-resumable out/batch1-hil-resumable-probe/probe.json
node runner/src/hil-bld-batch-main.ts resume HIL out/batch1-hil-resumable out/batch1-hil-resumable-probe/probe.json
```

BLD substitutes its host and `batch1-bld-resumable` paths after pulling the published producer.
Resume uses the original directory, source/runtime and probe; it does not change a row's scientific
target or update limit. Use Ctrl+C in a visible launch terminal to stop the coordinator and its owned
workers. Detached operation records its exact owned-process stop command with the launch controls;
an OS termination can lose the current unfinished cycle, while completed checkpoint generations remain.
Each checkpoint publishes after a complete cycle, including a just-fired history event. The two
referenced generations are retained; a third superseded generation is reproducible recovery scratch.
Uncommitted observation tails and partial generations are preserved for diagnosis. Resume wallSeconds
sums checkpointed active intervals and the current attempt; lost in-flight time is separately visible
in process-attempt receipts and is not recovered by inventing elapsed time from a dead process.

One bounded non-author Codex/GPT-6 review, with inherited shared context, independently reproduced
partial-result recovery failure using a real checkpoint. It also traced a stale-owner takeover race
between simultaneous resume commands. Repairs route partial result/exit receipts into validated
checkpoint recovery, atomically publish batch receipts and serialize stale-owner replacement with
an exclusive acquisition guard. Real competing worker tests exercise the row boundary. An interrupted
acquisition guard fails closed for explicit owner inspection; no automatic takeover-of-takeover is
introduced. The reviewer did not run the full suite, a campaign, or the N64 interruption witness.
The author verified these repairs with targeted checks and the full suite below.

## Resume verification and publication

Exact `npm.cmd test` at clean `a8790299add706e639b3f7ffc4bcbf29ae0f8b2b`, Node v24.13.1, exited zero: 233 files / 3031 tests passed, 23 skipped; Vitest 886.86 seconds. Rule 7 and both typechecks are included.
The [verification receipt](../../evidence/discovery-resume-2026-10-07/verification.json) binds raw logs, commands, source and exit. No implementation change follows this checkpoint.

The [real N64 witness](../../evidence/discovery-resume-2026-10-07/n64-receipt.json) at `0747ea9` uses the registered HIL basal-only, radius-three/thickness-one, -7 C row with only its maximum updates reduced to three. Worker 24896 was actually terminated after committed tick one; fresh worker 7704 resumed to tick three. Direct worker 21060 and resumed worker both exited zero with three converged updates, step-cap termination and no integrity errors. The complete 4,459,061-byte final solver states match SHA-256 `6f320f5971dc3552f79112dde62345100b7a2558f9c0c9811eb65f23cd3fb047`; scientific results, three event records and the 37,389-byte spatial snapshot match after excluding only declared operational time/RSS fields. This is one short N64 restart witness, not an endpoint or mature-capacity result. Only progress/plan prose changed before the passing full check; the receipt verifies unchanged executable source.

Project-owned verification bytes fit Git and are permanently retained in `evidence/discovery-resume-2026-10-07/`, pinned in the root manifest. `n64-witness.tar.gz` contains the complete raw witness, checkpoint generations, interruption state, observations and process receipts; a fresh extraction was compared with every original file. The bundle also retains the original HIL stop records. All original staging remains.

Rule 16 inventory records exactly the primary main checkout, stopped `codex/hil-first-batch` at `f4ca38a`, and `codex/discovery-resume` implementation checkout. Primary's six task prose copies are preserved by the implementation commits; only those duplicates may be reconciled before fast-forwarding main. The old execution checkout and all outputs remain retained. No unrelated changes or temporary review worktree were found; no PR is used for this maker-authorized main publication. The implementation checkout becomes the fixed-source replacement execution checkout after publication. Keep its HEAD unchanged from capacity qualification through campaign completion; maintain live progress only in primary.

Hidden-run controls are prepared under implementation `out/batch1-hil-resumable-control-20261007/`. Exact pause: `powershell.exe -NoProfile -ExecutionPolicy Bypass -File out/batch1-hil-resumable-control-20261007/stop-hil.ps1`; it records and stops only the matching wrapper/coordinator/workers and retains all output. Resume uses the command above (or `resume-hil.ps1` in a persistent terminal). Launch remains pending until the changed checkpointing producer passes its fresh HIL resource probe.

Closeout metadata checks passed: two files / 18 tests for evidence integrity and the progress index,
plus Rule 7 lint. `closeout-checks.json` and its two logs in the verification bundle bind the commands
and exits. Raw full-check log EOF whitespace is retained byte-exact and excluded only from the
whitespace check; no implementation changed after the full-check checkpoint.

## HIL resumable execution 2026-10-07

Shared main was pushed and remotely verified at `b9cf7ed72c82e350b93570fafd8e45afa0b95d53`.
Primary main was fast-forwarded after reconciling only its six task-owned prose copies;
`out/hil-resume-reconciliation-b9cf7ed/receipt.json` retains their exact local snapshots and
disposition. Three worktrees remain: primary main, retained original `codex/hil-first-batch` at
`f4ca38a`, and replacement execution `codex/discovery-resume` in `.tmp-discovery-resume/` at `b9cf7ed`.
All were tracked/untracked clean at publication; ignored outputs and dependencies are retained.
No PR or temporary review checkout was created. Do not change the replacement execution HEAD.

Hidden wrapper PID 18404 started at `2026-10-08T05:31:45.1218942Z`, recorded in execution
`out/batch1-hil-resumable-control-20261007/invocation.json`. No scientific or Vitest worker was
present before qualification. It executes the registered probe and then the registered launch
command above only if qualification succeeds. `state.json`, separate probe/campaign stdout and
stderr, and real exit receipts in that control directory record each phase. Live prose is
maintained only in primary; this execution record is intentionally not committed in the running checkout.

The probe exited zero at `2026-10-08T05:39:28.4160867Z` (`probe-exit.json`). Its `probe.json`
qualifies actual maximum concurrency 1/4/8/16 and recommends 16. The 16-worker rung took
61.593 seconds, with minimum available physical memory 51,306,455,040 bytes and minimum commit
headroom 59,790,082,048 bytes. These are short-prefix measurements, not mature-geometry capacity.

Replacement production launched at `2026-10-08T05:39:28.651Z` (22:39 PDT), bound by
`out/batch1-hil-resumable/campaign.json` and `first-batch-HIL-launch.json` to the published source,
56 registered rows and concurrency 16. At `2026-10-08T05:41:12.986Z`, control `startup-check.json`
observed all 16 started rows with committed complete-cycle checkpoints (ticks 20–21); the named
resource sample contains 16 live children, available physical memory 50,624,356,352 bytes and
commit headroom 59,100,864,512 bytes. This establishes operational startup and ongoing checkpoint
publication, not completed scientific outcomes. The entire stopped original run remains retained.

Exact production resume, from the fixed execution checkout after its prior processes are stopped:

```powershell
node runner/src/hil-bld-batch-main.ts resume HIL out/batch1-hil-resumable out/batch1-hil-resumable-probe/probe.json
```

Use the recorded stop/resume control scripts for this hidden launch; a visible resume terminal
supports Ctrl+C. Attempt stdout/stderr live under `rows/<row-id>/attempts/<attempt-name>/`, with
separate real exit receipts. Keep all row/checkpoint generations, probe and control files until
joint HIL/BLD review and governed preservation. On completion inspect `first-batch-HIL-complete.json`
and `campaign-exit.json`, then run the existing `summarize` command for `out/batch1-hil-resumable`.
BLD must stop its old source before updating, pull the shared producer, run its own new probe and
launch into new paths; old observations cannot be retroactively resumed. No BLD process was controlled.

## HIL completion 2026-10-08

The 56-row queue ended at `2026-10-08T09:57:50.191Z` (02:57 PDT), wrapper exit 2; no row
remained unstarted and no coordinator abort occurred. Of those rows, 50 reached extent 21
with exit zero; six stopped on EPERM while renaming a pending checkpoint generation. This is
not an all-success completion. There was no production wall-time cutoff. The full census is
execution `out/batch1-hil-resumable-control-20261007/completion-triage-20261008.json`.
Each failed row has a valid converged checkpoint one cycle before the failed publication; their
source binding remains `b9cf7ed`. Preserve them for explicit recovery without changing that checkout.
The cause of the Windows rename denial is unproven; no numerical convergence failure was recorded.

The maker selected the [next HIL exploration batch](hil-exploration-batch2.md). Its sixteen new
seed/pressure rows use the measured first-batch leads; the six missing endpoints remain unresolved.
The old run and its source/runtime, logs, checkpoints and failed tails remain retained. Do not
silently consume these checkpoints under a newer producer or repeat all fifty completed endpoints.

## Registered original first stage (elapsed-time policy superseded above)

The following are design choices, not measured outcomes. All rows use N64, dx 0.35 um,
fill CFL 0.05, largest extent target 21, spatial samples at pre-update extent crossings
5/9/13/17, maximum 20,000 updates, and a four-hour wall budget per row. The parent terminates
a nonresponsive child after an additional 60 seconds. Existing discovery fixed settings remain:
v6, monopole boundary, hexagonal prism, noise zero, seed one, residual tolerance 1e-9,
divergence tolerance 1e-7, maximum 200,000 relaxation sweeps. Sigma is the named fraction of
`phase6SigmaWaterFromTable(tempC)`, computed without hand-rounded substitution. Pressure is
101325 Pa except where explicitly varied. Canonical seed radius 2 / thickness 1 except seed track.

| Host | Track | Cartesian comparisons | Rows |
|---|---|---|---:|
| HIL | seed | -7/-9 C, fraction .15, radius/thickness 3/1 and 1/5, four facet arms | 16 |
| HIL | pressure | -6 C, fractions .10/.15/.20, 50662.5/202650 Pa, four facet arms | 24 |
| HIL | environment history | -6 to -14.4 C and reverse, fraction .15 at each environment, switches at extent 7/11/15, ordinary M1/no-dip; four matching static controls | 16 |
| BLD | cold core/tip | -12/-14.4/-18 C, fractions .10/.15/.20, four facet arms | 36 |
| BLD | warm history | -4.5/-5 C, fraction .075, broad/no-dip, full local basal width 3, early-only width 3 with cutoff 20 physical seconds | 6 |

Four facet arms mean both, neither, basal-only and prism-only through the existing explicit
experimental facet API with M1 base. Histories use ordinary preparations, never experimental
facet/width plus environment events. Static controls use the same sampling contract as switched
rows. Repeated controls supply newly matched spatial observations; the prior completed matrices
are not reopened. Each host queue interleaves comparison blocks where practical.

This coarse stage asks about early structure, growth memory and facet/transport interactions.
Fine-grid and changed-seed warm-history refinement remains a later selected stage. Target 21 is
a smaller observation window than the old target 29; it does not inherit the old final findings.
Four hours is a bounded loss limit, not a prediction of endpoint completion. A cap, missed event,
or cutoff not reached leaves that comparison unresolved; it cannot establish an absent effect.

## Execution and resource qualification

Historical original protocol: its non-resumable execution and wall budgets are superseded by the resume section above. The finite roster, worker ceilings and memory limits remain.

One finite CLI provides `list HIL|BLD`, `probe HIL|BLD <directory>`,
`launch HIL|BLD <directory> <probe-receipt>`, and `summarize <directory>`.
HIL's process ceiling is 16 and BLD's 28, from the approved declared capacity minus four slots.
Probe actual row families with short three-update prefixes at process counts 1/4/8/16 for HIL
and 1/4/8/16/28 for BLD; bind the receipt to host, runtime, source and workload.
Each probe child has a three-minute budget. A failed rung cannot qualify its worker count.
Record available memory and commit headroom, per-process memory and actual concurrency/timing.
Require at least 12 GiB available RAM and 8 GiB commit headroom. At launch, monitor those same
limits and stop owned children/queue on exhaustion. Short-prefix measurements are explicitly
non-transferable to mature geometry; live monitoring and bounded terminal stages manage that
remaining uncertainty. No experimental checkpoint-resume claim is made.

The finite representatives are six HIL paths (two seed geometries, two pressure extremes, and
ordinary M1/no-dip histories) and seven BLD paths (four cold facet arms and three warm modes).
`firstBatchRepresentativeRows()` names exact rows. At each rung, cycle these representatives
through `max(representative count, requested workers)` jobs. These deliberately limited prefixes
do not qualify every scientific setting or the post-event environment. A failed rung stops the
ladder and leaves the largest earlier safe rung available; no completed rung means no launch.

### Commands after publication

In the clean task checkout on BLD, pull the published main version and install locked dependencies.
Use Node v24.13.1 on both hosts to retain the recorded oracle runtime scope.
List is immediate; probe runs actual bounded numerical work and records its limits. Close other
heavy compute before qualification. Do not pull a changed source commit between probe and launch.

```powershell
git pull --ff-only origin main
npm.cmd ci
node runner/src/hil-bld-batch-main.ts list BLD
node runner/src/hil-bld-batch-main.ts probe BLD out/batch1-bld-probe
node runner/src/hil-bld-batch-main.ts launch BLD out/batch1-bld out/batch1-bld-probe/probe.json
node runner/src/hil-bld-batch-main.ts summarize out/batch1-bld
```

HIL substitutes `HIL` and `batch1-hil`. The launch command uses the measured recommendation;
it does not silently assume the planning ceiling. Run it in a persistent local terminal, or
use PowerShell `Start-Process -WindowStyle Hidden` with separate launcher stdout/stderr paths.
Per-case logs are already separate under `rows/<row-id>/`; `first-batch-BLD-status.json` records
active/completed work and `first-batch-BLD-resources.jsonl` records sampled memory. Keep all output
directories intact for joint review. Existing output paths are refused; repeat probes use new paths.

Every row retains its command, source/runtime, separate stdout/stderr, exit status, spec,
completed events, spatial snapshots and terminal status. Resume means rerunning an explicitly
unfinished row from its seed into a fresh directory; this is fresh computation, not checkpoint
continuation. Never overwrite a row. An interrupted relaxation is not a completed event.
Legacy `admissible` remains restricted to valid size-target endpoints. Summary checks read the
persisted events and result and distinguish reached endpoints, capped prefixes and failures;
they do not inherit an admissibility flag or silently accept a partial relaxation.

## Readout and interpretation

The first deliverable is a launchable producer and an honest inventory of event coverage,
physical-time range, size crossings and termination. Retained events and spatial snapshots
support later track-specific readouts: seed volume/occupancy and facet contributions; pressure
at common physical age and size; cold central-plane core/tip radii and depth; warm surviving/new
openings and demand after cutoff; exact event time and elapsed physical seconds for histories.
Compare common physical-time brackets, never interface-cycle offsets. Full morphology reports
follow completed bundles and joint review; a generic terminal summary is not that analysis.

## Smallest implementation and verification

Plausible accidental failures are selecting the wrong host's rows, unbounded experimental work,
oversubscribing RAM, losing the distinction between a completed update and interrupted solve,
and interpreting a cap as a negative result. They affect scientific prefixes and comparison
membership. Existing launch code records rows but lacks named loads, wall limits and local
qualification; existing analyzers reject incomplete rows but do not inventory this new roster.
Add only those seams. This is solo research; hostile substitution is outside scope.

- Commit this protocol before implementation.
- Reuse the discovery solver/row producer and child-process queue; preserve legacy defaults.
- Test factorial membership, host disjointness, timer interruption before/after complete updates,
  legacy admissibility, actual subprocess logs/exits/overlap, resource failures and capped summary.
- Exercise a bounded actual HIL experimental prefix and terminal stop; publish the local command
  and outcome. BLD's local probe is its first executable task after pulling.
- Run exact `npm.cmd test` once the implementation stabilizes, then integrate and push.

## Source currency and limits

Bounded Rule 12 check on 2026-10-07 inspected submission histories for
[TAX2](https://arxiv.org/abs/2306.13087) (v1),
[CM9](https://arxiv.org/abs/2011.02353) (v1) and
[CM4](https://arxiv.org/abs/1512.03389) (v2), and the
[author publication list](https://www.its.caltech.edu/~atomic/publist/kglpub.htm).
No superseding snow-growth entry was found there after TAX2; this is not an exhaustive review.
No new physical parameter extraction, solver-physics change, validation or Phase 7/S6 work occurs.

## HIL execution 2026-10-07

**Stopped at maker direction; the following is its retained original launch record.** Use the replacement paths and resume protocol above for new execution.

The maker requested a new HIL execution worktree after reporting BLD started. Git remote
`refs/heads/main` was verified at `f4ca38a44fefda0de514491bd5ce3044479829ec` on this host.
Managed worktree `C:/Users/biao3/.codex/worktrees/hil-first-batch/snowflake`, branch
`codex/hil-first-batch`, is clean at that source commit with locked dependencies installed and
Node v24.13.1. Keep this execution HEAD and source fixed through campaign completion: the
probe binds the source and each queued row records HEAD when it starts. Maintain live prose
in the primary checkout; this separation avoids changing the running source identity.

The hidden detached wrapper started at `2026-10-08T04:08:07.3893597Z`, PID 8344, recorded in
execution-worktree `out/batch1-hil-control-20261007T210807/invocation.json`. Commands below are
readable equivalents; exact absolute arguments are in probe `invocation.json` and `campaign.json`:

```powershell
node runner/src/hil-bld-batch-main.ts probe HIL out/batch1-hil-probe
node runner/src/hil-bld-batch-main.ts launch HIL out/batch1-hil out/batch1-hil-probe/probe.json
```

The probe exited zero at `2026-10-08T04:15:46.1940360Z` (`probe-exit.json`). All four rungs
qualified with actual concurrency 1/4/8/16, and `out/batch1-hil-probe/probe.json` recommends 16.
The 16-worker rung took 61.395 seconds; its minimum available physical memory was 52,265,893,888
bytes and minimum commit headroom 60,545,335,296 bytes. These figures are from that receipt's
16-worker rung, not a mature-geometry capacity claim.

The campaign launched at `2026-10-08T04:15:46.437Z` (21:15 PDT on October 7), recorded in
`out/batch1-hil/first-batch-HIL-launch.json`; `campaign.json` binds 56 rows and concurrency 16
to frozen `f4ca38a`. The resource sample at `2026-10-08T04:16:45.1080189Z` records 16 live
children. Initial row status/events show completed updates in all 16 launched rows; their
stderr files were empty at this startup inspection. This establishes operational startup only.

Control `state.json`, separate `probe.stdout.log` / `probe.stderr.log`, `probe-exit.json`,
`campaign.stdout.log` / `campaign.stderr.log` and eventual `campaign-exit.json` live under
the control directory above. Per-row logs, commands, exit receipts and resource samples live
under the probe/campaign directories. These are active local staging: retain the worktree and
all outputs until joint review and the applicable evidence/asset preservation step.

This is solo scientific exploration with hostile actors excluded. The immediate deliverable,
the registered HIL queue running at locally qualified concurrency, is established by those
receipts and live workers. No scientific code or protocol changed, so the existing full-check receipt remains
the implementation check. These short prefixes qualify only their measured workload; live
memory limits and four-hour terminal stages still apply. No experimental resume is claimed.

Next: inspect resource samples and `rows/<row-id>/status.json` / logs; the aggregate status file
appears after the first row finishes. Once `first-batch-HIL-complete.json` and the control
`campaign-exit.json` exist, run `node runner/src/hil-bld-batch-main.ts summarize out/batch1-hil`
from the execution worktree. Preserve capped prefixes as unresolved, gather BLD's receipts and
jointly review before selecting follow-up work. Do not pull, edit or commit in the execution
worktree, start a duplicate queue, or remove it while it owns these active output bytes.

## Tried and rejected

- The first resume full check at `0747ea9` exited one solely on two progress-index assertions:
  the required literal `pause/resume before launch` had been changed to `before relaunch`.
  Its receipt in `out/discovery-resume-verification-2026-10-07/full-check-result.json` and raw logs
  record 232 passing files / 3,029 passing tests, 23 skipped and those two failures. Restore the
  required prose, retain the failed receipt and rerun exact `npm.cmd test`; executable code and
  the passing N64 interruption witness are unchanged.

- Four-hour terminal stages without restart (maker rejected 2026-10-07): the time budget was not
  measured to reach every scientific event and could lose informative later behavior. HIL's original
  run is stopped and retained; implement real continuation before rerunning without that cutoff.

- Portfolio-only publication left BLD without executable work. This slice supplies named commands.
- Reusing ordinary three-cycle host capacity as experimental qualification would cross the
  measured configuration; the new probe exercises actual roster families and reports its limits.
- Starting full fine-grid histories without restart repeats the paid-for multi-day loss risk.
  Completed-wave artifact `rows[].analysis.result.wallSeconds` records long fine runs; keep them
  out of this bounded coarse first stage.
- Widening ordinary checkpoint eligibility or treating observations as restart state was rejected.
  Accepted ADR 0060 supplies the separate tested discovery format while preserving ordinary refusals
  and proposed ADR 0039's production boundary.

## Implementation record

Protocol committed at `3948c8f` before code; implementation checkpoint `ad990ac` adds the finite
roster, named CLI, reused queue, optional discovery wall budget and coverage inventory. Ordinary
solver equations and checkpoint refusals remain unchanged. HIL has 56 rows and BLD 42, directly
enumerated by `hil-bld-batch-roster.ts`; the roster tests exercise every factorial block.

Exact `npm.cmd test` at clean `ad990ac`, Node v24.13.1, exited zero: 230 files / 2,981 tests passed,
23 skipped, Vitest duration 819.92 seconds. Source: tracked
[`verification.json`](../../evidence/hil-bld-first-batch-2026-10-07/verification.json),
`full-check-result.json` and raw full-check stdout/stderr in the same bundle. Rule 7 and both
typechecks are included. No implementation changes followed this checkpoint.

The tracked `actual-prefix/receipt.json` records two real N64 three-update cases on HIL: a
basal-only seed row and an early-width warm row, both completed with exit zero. The queue recorded
actual maximum concurrency two, child commands/logs/exits and live Windows memory samples.
These are operational prefix witnesses, not full host budget qualification or scientific endpoints.
Budget tests also execute real tiny experimental updates and compare interrupted prefixes to
uninterrupted events; process tests execute child overlap, timeout, memory stop and independent
row failure continuation. BLD must run its own supplied probe after pulling.

One bounded shared-context Codex/GPT-6 review found missing summary CFL enforcement and weak
validation when terminal results were absent. Both were corrected and pinned by real-artifact
mutation tests before the full check. The review did not execute a complete campaign or qualify BLD.

Retention: project-owned operational records fit Git and are copied byte-for-byte into
`evidence/hil-bld-first-batch-2026-10-07/`, with every file pinned in `evidence/MANIFEST.json`.
The task's original `out/first-batch-verification/` is copied and byte-verified in primary staging
`out/hil-bld-first-batch-verification-2026-10-07/`; the tracked `custody.json` records the inventory
before non-force worktree reconciliation. Dependencies and Vitest cache are reproducible scratch.
No NAS payload or pre-existing output is pruned; the full scientific queues have not launched.

Closeout checks: `npx.cmd vitest run runner/test/evidence-integrity.test.ts runner/test/progress-index.test.ts`
passed 2 files / 18 tests, and `npm.cmd run lint:rule7` passed. Whitespace checking preserves the
two exact raw full-check logs, whose terminal blank lines are intentional recorded bytes:
`git -c core.whitespace=cr-at-eol diff --cached --check -- . ':(exclude)evidence/hil-bld-first-batch-2026-10-07/full-check.stdout.log' ':(exclude)evidence/hil-bld-first-batch-2026-10-07/full-check.stderr.log'`.
The unexcluded first attempt reported only those raw-log EOF blank lines; no artifact was normalized.

Publication closeout: main includes `3948c8f`, `ad990ac`, `60b55e9` and `f4ca38a`. The original implementation worktree/ref were reconciled and removed without force after byte-verified custody. The earlier authentication wait is resolved: `git ls-remote origin refs/heads/main` now returns `f4ca38a44fefda0de514491bd5ce3044479829ec`. Current host execution is recorded above; source tests are complete and are not repeated for dispatch.
