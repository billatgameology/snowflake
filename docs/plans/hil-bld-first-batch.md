# HIL / BLD first exploration batch

- **Scope:** executable first stage of the maker-approved post-Phase-10 portfolio; development evidence only.
- **Status:** BLD legacy run stopped at maker request; implementing checkpoint continuation under ADR 0060. The amendment below supersedes its four-hour limit and seed-rerun recovery. HIL remains on the published original path.
- **Branch / destination:** `science/hil-bld-first-batch` -> `origin/main`.
- **Authority:** [adaptive discovery](post-phase10-adaptive-discovery.md#exploration-portfolio-for-hil-and-bld), accepted ADRs 0055-0059, attachment-kinetics specification. No phase gate changes.

## Goal and done when

BLD can pull one tested producer, select its named workload, measure its local resource budget,
and launch a finite queue without needing HIL to design another protocol. HIL has the equivalent
commands for its own queue. This milestone has no charter phase done-when; completion requires
all named rows selectable, bounded execution and resource checks exercised, focused negative
controls and exact `npm test` passing, and shared code published. Scientific results follow the
maker's dispatch; this implementation session does not start the full campaign.

## Registered first stage

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

## Tried and rejected

- Portfolio-only publication left BLD without executable work. This slice supplies named commands.
- Reusing ordinary three-cycle host capacity as experimental qualification would cross the
  measured configuration; the new probe exercises actual roster families and reports its limits.
- Starting full fine-grid histories without restart repeats the paid-for multi-day loss risk.
  Completed-wave artifact `rows[].analysis.result.wallSeconds` records long fine runs; keep them
  out of this bounded coarse first stage.
- Experimental resume currently conflicts with explicit solver checkpoint exclusions and proposed
  ADR 0039. Do not bypass them or call observations/replay restart state.

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

Historical publication interruption (resolved below): local main contains `3948c8f`, `ad990ac` and `60b55e9`. The original task worktree/ref were reconciled and removed without force after byte-verified custody. Command-line Git has no saved GitHub login; its push opened a Connect to GitHub window and remains pending. Last remote check still returned `f92bf5f`. Complete that sign-in or push main through the signed-in GitHub Desktop before asking BLD to pull. Source tests are complete; do not repeat the science suite merely to finish authentication.

BLD integration receipt, 2026-10-07: the maker completed publication and pulled the primary checkout.
Local `main` and `origin/main` both resolve to `f4ca38a44fefda0de514491bd5ce3044479829ec`.
BLD merged that version into `codex/bld-exploration` at `G:/Code Files/snowflake-bld-exploration`,
retaining its original setup commit and resolving the overlapping PROGRESS text. The GitHub
sign-in blocker above is historical. Runner, solver, tests and evidence remain the published bytes;
only host/setup/publication prose differs. `npm.cmd ci` completed in the task worktree.
The maker then requested a stop before any numerical work to update BLD's OS. Finish that update
and wait for explicit maker resume before a fresh registered BLD probe; no existing host-budget
receipt is being claimed. No probe or full campaign ran as part of this integration.

Integration checks passed: Rule 7, progress-index/evidence-integrity and the non-simulation
`list BLD` command. The first list attempt lacked installed workspace packages; `npm.cmd ci`
resolved that setup prerequisite. The first progress check caught omitted standing restart wording;
the representative pause/resume-or-short-stage boundary was restored without changing the test.
Imported science/evidence bytes match main; HIL's recorded full check remains the implementation
verification, and this documentation integration does not claim a new full-suite result.

Exact BLD integration check commands (all exited zero): `npm.cmd run lint:rule7`,
`npx.cmd vitest run runner/test/progress-index.test.ts runner/test/evidence-integrity.test.ts --no-cache`,
`node runner/src/hil-bld-batch-main.ts list BLD`, and
`git -c core.whitespace=cr-at-eol diff --cached main --check`. Source comparison
`git diff --cached main --name-only` lists only the three edited plan/state documents.

## BLD execution after OS restart — 2026-10-07

The maker reports the computer restarted and authorizes proceeding with the experiment, ending
the OS-update hold. The end-to-end deliverable is the registered BLD queue with terminal
classifications and preserved raw events; begin with the unchanged host-capacity probe.
This is solo scientific research; hostile actors remain outside scope. Relevant failure lessons
are Phase 6 A3/D2 (separate writers/logs), C2 (non-transferable capacity/configuration), and B1/B2
(actual producer/check execution). Existing probe receipt validation, resource monitoring and
terminal summary are the checks; no additional assurance machinery or science changes.

Launch from `G:/Code Files/snowflake-bld-exploration` after committing this release:

- `node runner/src/hil-bld-batch-main.ts probe BLD out/batch1-bld-probe`
- On a completed successful probe, `node runner/src/hil-bld-batch-main.ts launch BLD out/batch1-bld out/batch1-bld-probe/probe.json`.
- After terminal completion, `node runner/src/hil-bld-batch-main.ts summarize out/batch1-bld`.

Use `out/batch1-bld-control/run-stage.ps1` only to invoke these existing commands with a hidden
PowerShell process and retain stage start/exit records. Separate logs are
`out/batch1-bld-control/{probe,launch}.stdout.log` and matching `.stderr.log`; the corresponding
`.exit.json` records actual completion/exit. This wrapper does not select rows, change budgets or
queue experiments. `preflight.json` records post-restart host/runtime, memory and storage.
Probe state and actual concurrency are in `out/batch1-bld-probe/probe.json`; campaign state is in
`out/batch1-bld/first-batch-BLD-status.json`, `first-batch-BLD-resources.jsonl` and the terminal
`first-batch-BLD-complete.json`. Read those records before any restart or duplicate launch; an
authorized command is not a completed result. Keep the producer commit unchanged through both
stages and the running queue; update terminal state after it finishes.

All row outputs and operational logs remain local staging for this active task and are retained
for joint review; promote fitting claim-bearing results under the existing evidence/asset rules
at closeout. No local output is disposable or pruned. Capped cases remain unresolved.

## BLD resumability amendment — 2026-10-07

Goal: the same BLD row continues from saved scientific state after a real process interruption, without a four-hour wall cutoff. This is the one end-to-end deliverable. Solo scientific research; hostile actors excluded. ADR [0060](../decisions/0060-resume-bld-development-experiments.md) and amended charter/spec authorize this distinct format; ordinary checkpoint formats and proposed ADR 0039 remain unchanged. This supersedes conflicting BLD instructions above, including seed-only restart; historical records remain history.

The maker explicitly stopped the current run. Local staging `out/batch1-bld-control/operator-stop.json` and `operator-stop-processes-before.json` record the owned launcher stop and no remaining BLD processes. Preserve `out/batch1-bld/` as an interrupted legacy prefix with no restart state. The original probe is `out/batch1-bld-probe/probe.json`; changing the producer requires fresh qualification. No terminal completion is inferred from absent exit files.

Approach and steps, committed before implementation:

1. Add a strict experimental envelope and solver export/restore API for four facet arms, broad/no-dip, full width and early-only width. Reuse v3 streaming and single-consume ownership; preserve ordinary refusals. No timeline, hole-fill, late-only, GPU or scientific equation change.
2. Share the existing scientific row loop with an asynchronous continuation driver. Save initial state and every completed update, accumulated readouts, pending snapshots and exact committed event prefix. Two rolling slots with flushed files and atomic pointer replacement protect against incomplete writes. Preserve any uncommitted output tail before rollback. Per-attempt logs/exits remain separate.
3. Extend BLD launch with no wall deadline; add `pause <campaign>` and `resume <campaign>`. Pause stops dispatch and lets workers finish the update. Resume checks immutable source/runtime/row bindings, skips terminal rows and restores unfinished rows. Keep memory monitoring. The existing 20,000-update budget becomes a review pause, with another allowance on resume; scientific endpoint guards remain.
4. Compare direct and multiply restored continuations across all seven modes: attachments, nonuniform vapor, partial fill, lag/ledgers and early cutoff transitions. Check ordinary refusals, malformed identity and interrupted publication/prefix handling. Execute a real fresh-process pause/resume with matching scientific events and terminal state before launch.
5. At a stable implementation checkpoint run exact `npm.cmd test` (scientific codec/solver/readout surface), one bounded shared-context review, then fresh BLD probe and the authorized campaign in a new directory. Record exact launch, cadence, resume command and actual concurrency. Do not overwrite old evidence.

Done when: supported cases resume the same numerical and observational state after a process stop, direct/resumed witnesses agree, no BLD four-hour deadline exists, terminal/paused/failure states remain distinct, required checks pass and the actual recovery command is recorded. No charter phase milestone is claimed.

Rule 14A: accidental loss of runtime progress, wrong restored preparation, stale width activity, truncated writes, duplicated observations and simultaneous writers affect scientific state/comparisons. Ordinary resume rejects these modes; logs cannot restore field/fill/order. Reuse the codec and scientific loop, a local atomic save and one campaign ownership lock instead of a new service/registry. Their cost is below rerunning hours/days of computation. Deliberate runtime/repository substitution remains outside scope.

Known failures: reread lessons on paid-for non-resumable runs, insertion-order continuation and configuration transfer before launch. Existing lk-resume, lk-basal-width, discovery and batch suites cover the nearest boundaries; they do not prove arbitrary protocols. Required representative pause/resume before launch uses files and a new process. The fresh probe keeps a short operational timeout, not a mature-geometry capacity claim.

### Tried and rejected for this amendment

- Merely deleting the four-hour cutoff leaves purchased progress vulnerable; stopped before extending that run.
- Historical checkpoint exclusions are preserved; new experiment identity is required.
