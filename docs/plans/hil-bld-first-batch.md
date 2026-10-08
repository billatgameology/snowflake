# HIL / BLD first exploration batch

- **Scope:** executable first stage of the maker-approved post-Phase-10 portfolio; development evidence only.
- **Status:** protocol registered before implementation, 2026-10-07.
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
Probe each host's actual row families with short three-update prefixes at increasing process
counts up to its ceiling; bind the measured receipt to host, runtime, source and workload.
Each probe child has a three-minute budget. A failed rung cannot qualify its worker count.
Record available memory and commit headroom, per-process memory and actual concurrency/timing.
Require at least 12 GiB available RAM and 8 GiB commit headroom. At launch, monitor those same
limits and stop owned children/queue on exhaustion. Short-prefix measurements are explicitly
non-transferable to mature geometry; live monitoring and bounded terminal stages manage that
remaining uncertainty. No experimental checkpoint-resume claim is made.

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

Pending. Local probe outputs are operational staging, not new scientific conclusions. Preserve
useful receipts under governed evidence before task closeout; do not delete scientific outputs.
