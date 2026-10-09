# Plan — HIL warm-cavity representation qualification

- **Phase:** post-Phase-10 model-development exploration; charter section 2.5 and accepted decisions 0058, 0059 and 0060.
- **Status:** protocol registered; implementation and launch qualification in progress.
- **Started / last touched:** 2026-10-08 by Codex/GPT-6.
- **Branch / checkout:** `codex/hil-warm-refinement`, `C:/Users/biao3/.codex/worktrees/hil-warm-refinement/snowflake`, from `0be1d4e`.
- **Authority:** maker accepted the saved-data follow-up recommendation and directed proceeding. HIL owns execution; propose BLD only if representative timing supports multiple days.

## Goal

Determine whether the warm early-growth opening persists when grid spacing, seed representation
and width selection are compared at matched physical scales. The immediate end-to-end deliverable
is six named finite cases running on HIL with demonstrated N126 restart and measured resource
capacity. Solo scientific research; hostile actors excluded. Use the existing solver, checkpoint
format, queue and cavity readouts; deliver the experiment before expanding infrastructure.

## Done when

There is no separate charter milestone for this dispatch. All six registered rows must be
selectable; the N126 state must round-trip and continue identically across a real process
interruption; focused checks, one bounded review and exact `npm.cmd test` must pass; the committed
producer must pass a fresh HIL resource probe and launch with actual concurrency, logs, checkpoint
cadence and exact resume commands recorded. A successful launch does not imply scientific
completion. Subsequent analysis requires six terminal dispositions and explicit missing/invalid
members, common-size and common-age comparisons, and the post-switch observations below.

## Frozen comparison

The six-row candidate in [adaptive discovery](post-phase10-adaptive-discovery.md#warm-cavity-track-retained-candidate-comparison)
is selected. Each configuration has a broad ordinary `M1_NO_DIP_ABLATION` control and an M1-base
early-only width arm with cutoff 20 physical seconds and broad prism kinetics.

| ID configuration | N | dx (um) | Seed radius / thickness | Width threshold | Target extent | Pre-update spatial crossings |
|---|---:|---:|---|---:|---:|---|
| coarse | 64 | 0.35 | 2 / 1 | 3 | 29 | 5, 9, 13, 17, 21, 25 |
| fine-thin | 126 | 0.175 | 4 / 1 | 6 | 57 | 9, 17, 25, 33, 41, 49 |
| fine-thick | 126 | 0.175 | 4 / 3 | 6 | 57 | 9, 17, 25, 33, 41, 49 |

Row IDs are `warm-refine-<configuration>-t4p5-<broad|early>`. All rows use -4.5 C,
fraction .075 times `phase6SigmaWaterFromTable(-4.5)` without a rounded substitution, pressure
101325 Pa, CFL .05, 100000 maximum updates, aggregate-v6, monopole-matched hexPrism, noise zero,
seed one, residual tolerance 1e-9, divergence tolerance 1e-7, and maximum 200000 relaxation sweeps.
The existing complete-update cutoff convention remains unchanged. No production wall deadline.
Size-target requires existing numerical/integrity checks; step-cap, insufficient post-switch
growth, convergence failure, contact and resource interruption are unresolved, never absent effects.

These are design operands, not measured outcomes: inclusive width `L*dx` is 1.05 um in both grids;
seed lattice-coordinate radius is .7 um; target largest center span `(extent-1)*dx` is 9.8 um;
shell coordinate half-lengths `(N/2-1)*dx` are 10.85 um. Fine inclusive seed thicknesses .175/.525 um
bracket coarse .35 um. Seed geometry/volume and discrete shells are not identical, and nonlinear
outputs are not bounded by the seed bracket. Shell matching is not domain independence.
The two coarse repeats supply matched controls under this producer and longer observations than
BLD's extent-21 batch. Retained N112 same-spacing early/broad trajectories are separate domain
sensitivity references; old M1/no-dip fine results do not test the temporal width law.

## Readout and decision

Reuse raw seed/attachment events to measure axial/lateral center spans, occupied-cell volume
(not mass), laterally enclosed and straight-axis-open planes, center/core profiles, added solid
waist thickness and maximum axial opening depth in physical units. Use a common physical central
probe radius (coarse one cell / fine two cells). Signed planes are not independent cavities.
Within each grid/seed pair, compare actual common physical ages with adjacent-event brackets;
across grids compare common physical size and age separately. Record actual cutoff crossing,
selected demand before/after it, surviving original openings, new post-cutoff openings and tip
advance. Compare growth increments from the actual switch, retaining each row's time bracket.

Use existing per-row cavity analysis and explicit pair/cross-grid tables. Its historical five-arm,
width-three history-group flag is inapplicable to these width-six pairs; do not inherit that verdict.
Sparse field snapshots may miss opening onset; report missing precursors without inferring them.
No extra source law, full-width/late arm or second temperature is needed for this first question.
Persistence with physically similar added waist/depth across both fine seeds strengthens the lead;
cell-fixed lengths, loss of the effect or seed-sensitive results redirect toward representation
and initialization. A two-spacing comparison is not a convergence order or physical validation.

## Approach, admitted failure and checks

The current discovery codec rejects N126 solely through its N64 cell bound. Extend the bounded
cell count to `126 ** 3`, preserving schema, numerical state semantics and the 64 MiB byte bound.
Worst encoded length is bounded by `25 * 126 ** 3 + 65536 + 12 = 50074948` bytes (two topology
lists each at most one entry per cell), below 67108864 bytes. Existing N64 bytes stay identical.
Accidental failure is inability to save/reload a valid finer case, losing expensive work; current
small-grid tests cannot exercise the admitted size. Add N126 round-trip/continuation and just-over-
limit refusals at the existing codec boundary. No new codec or streaming framework is required.

Reuse `DiscoveryBatchDefinition` and `runNamedDiscoveryBatch` with one thin roster/entry point.
Allow this batch a separate operational probe watchdog of 1800 seconds per child (three completed
updates), and include the actual six-worker ceiling in the existing ladder: 1, 4, 6. Old batches
retain their three-minute watchdog and original ladders. This is a resource-prefix budget, not
a scientific stop. The existing 12 GiB available-RAM and 8 GiB commit-headroom guard stays live.
Probe all six exact configurations; record its early-geometry limitation. Do not project mature
duration from three updates or transfer the old N64 sixteen-worker qualification.

Relevant lessons: A3/E4 require exclusive writers and complete reachable restart state; C2/C3/C6
and E5 require matched operands, scoped resource transfer, event brackets and model-only claims.
Read these and decisions 0058/0059/0060 before risky edits. Existing solver/runner discovery-resume,
publication, batch-execution/resume and roster tests cover the nearest boundaries. N126 witness
uses a registered fine-thick early row truncated to three completed updates only for operational
comparison: run uninterrupted, kill the other process after a committed nonzero cycle, resume
the identical row/producer/runtime, then compare final checkpoint bytes, scientific events,
spatial files and scientific result fields (excluding wall/RSS/attempt observations).

Run focused checks during implementation, then one bounded non-author review and exact
`npm.cmd test` at a stable committed checkpoint under Rule 6. Commit the plan before code.
Retain compact checks/receipts in tracked, pinned evidence and all useful raw staging in `out/`.
Keep the executing checkout/source fixed while cases run; record live state in primary.

## Source currency at protocol registration

Checked official arXiv version histories and the author's publication list on 2026-10-08:
[TAX2](https://arxiv.org/abs/2306.13087) remains v1;
[CM9](https://arxiv.org/abs/2011.02353) remains v1;
[CM4](https://arxiv.org/abs/1512.03389) remains v2.
The [author list](https://www.its.caltech.edu/~atomic/publist/kglpub.htm) lists no later snow-growth
paper than its 2023 entries; later listed 2025 papers concern teaching experiments. This bounded
currency check found no replacement for the adopted operands; it is not exhaustive literature
coverage. Existing source provenance and P3/P4 limitations remain; no parameter is refitted.

## Steps

- [ ] Commit protocol, extend the bounded codec and add the six-row route.
- [ ] Run focused checks, actual N126 interruption differential, bounded review and full check.
- [ ] Commit tested producer, qualify HIL at 1/4/6 workers and launch at its safe measured count.
- [ ] Record actual invocation, live paths and recovery commands in PROGRESS.
- [ ] After completion, compare paired and cross-grid outcomes using the registered readouts.

## Out of scope

New physics, ordinary codec changes, GPU execution, cross-source/host checkpoint migration,
BLD dispatch without a measured multi-day reason, unrelated history/seed expansion, Phase 7,
S6, education, NAS publication and pruning of retained source outputs.

## Tried and rejected

- Raising grid size while retaining N64 restart limits would defer failure until expensive work.
- A new streamed codec is unnecessary for this bounded N126 payload, which fits the current byte cap.
- Matching width by center span would substitute a different meaning for the specified inclusive chord.
- A short-run wall cutoff or a fresh-seed retry does not satisfy the maker's resumability requirement.

## Open questions

Actual HIL cost and mature memory use remain to be measured. A multi-day projection needs later
representative progress, not an inherited old-host duration. Scientific interpretation waits for
the complete pairs and retains finite-domain and initialization limitations.
