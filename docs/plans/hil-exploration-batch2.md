# Plan — HIL second exploration batch

- **Phase:** post-Phase-10 development exploration under the approved HIL/BLD portfolio.
- **Status:** registered; implementation and launch pending.
- **Started / last touched:** 2026-10-08 by Codex/GPT-6.
- **Branch / checkout:** `codex/hil-exploration-batch2`, `C:/Users/biao3/.codex/worktrees/hil-exploration-batch2/snowflake`.
- **Authority:** current charter section 2.5, accepted decisions 0055 and 0060; [portfolio](post-phase10-adaptive-discovery.md#exploration-portfolio-for-hil-and-bld).

## Goal

Launch the maker-requested next HIL batch: one finite set of new seed-crossover and pressure-midpoint
comparisons motivated by first-batch observations. Preserve resumability and repair the observed
checkpoint publication failure before dispatch. This is solo scientific research; hostile actors
are excluded. The end-to-end deliverable is sixteen named new rows executing with verified
complete-cycle checkpoints and no production wall deadline.

## Done when

There is no separate charter milestone for this dispatch. Completion means: the sixteen rows below
are registered and selectable; checkpoint publication retries only bounded transient I/O errors;
the old pointer survives a persistent publication failure; existing first-batch behavior is preserved;
focused checks and exact `npm.cmd test` pass; shared source is committed/pushed; the new workload
passes HIL's local resource ladder and launches at its measured concurrency with actual logs,
checkpoint cadence and exact pause/resume commands recorded. Scientific endpoint analysis follows
the running batch and is not implied by successful dispatch.

## First-batch evidence and limits

Original source remains fixed at `b9cf7ed` in primary `.tmp-discovery-resume/`. Its
`out/batch1-hil-resumable-control-20261007/completion-triage-20261008.json` inventories all 56 rows:
50 size-target/exit-zero endpoints and six checkpoint-publication errors. Production ran from
`2026-10-08T05:39:28.651Z` to `2026-10-08T09:57:50.191Z`, with maximum concurrency 16 and no
unstarted row or coordinator abort. All successful extents are 21. This bounded N64 batch ended;
it was not an all-success completion or evidence about mature growth.

The same directory's `science-triage-20261008.json` binds actual result/event/spatial bytes for
its full named inventory. At matched physical-age brackets, both-minus-neither aspect-ratio
contrasts retain opposite signs at -7/-9 C for each of the two seeds: wide +0.210526/-0.088816,
tall +0.428571/-0.117647 (rounded here). The -8 C quartet for each seed observes the intervening
response; it does not assume a monotonic crossover or identify physical causality.

For fraction .20, the completed both-arm pressure endpoints have aspect ratio 1 at both 50662.5
and 202650 Pa, but attached counts 3607 and 2787 and physical times 5.783881 and 18.169637 seconds
(rounded). Thus endpoint aspect ratio alone misses differences in size occupancy and growth rate.
Fraction .10 supplies four complete extreme-pressure arm pairs; .20 supplies three. The .20
high-pressure basal-only failure leaves that comparison unresolved; no endpoint is imputed.
The one-atmosphere quartet adds a response point for each forcing without repeating old rows.

These are internal measured discrete-model leads. Equal maximum extent may correspond to different
axial/lateral spans. Use the complete records and actual age brackets, never cycle-index alignment.
Keep the original outputs, including failed tails and all committed checkpoints. The six old valid
checkpoints are one cycle before the failed publication; this task does not migrate their source
binding or silently relaunch them under changed source.

## Frozen roster and stopping rules

| HIL block | Cartesian conditions | Rows |
|---|---|---:|
| Seed crossover | -8 C; fraction .15; radius/thickness 3/1 and 1/5; both, neither, basal-only, prism-only | 8 |
| Pressure midpoint | -6 C; 101325 Pa; fractions .10 and .20; radius/thickness 2/1; the same four arms | 8 |

All rows use the existing explicit decision-0055 facet identity with M1 base, N64, dx 0.35 um,
fill CFL .05, aggregate-v6, monopole far field, hexPrism, zero noise, seed one, residual tolerance
1e-9, divergence tolerance 1e-7 and maximum 200000 relaxation sweeps. Sigma is the named fraction
times `phase6SigmaWaterFromTable(tempC)` with no hand-rounded substitution. Seed-block pressure is
101325 Pa. Retain target maximum extent 21, maximum 20000 updates and pre-update spatial sample
crossings 5/9/13/17. No environment event, width intervention or geometric-closure intervention.

Size-target is a valid endpoint only with the existing independent row checks. Step cap remains
unresolved; contact, convergence, integrity and resource failures remain visible. There is no
elapsed-time scientific stop. A larger target/grid is a separate registered adequacy/capacity
decision, not an automatic continuation of this roster. No row is assigned to BLD or duplicates
its first-batch cold/warm-history queue.

Readout after completion: compare facet main/interaction contrasts in aspect ratio, reconstructed
axial/lateral spans, attached count, physical time to named size crossings, actual common-age
brackets, and the saved pre-update basal/prism vapor and attachment-coefficient observations.
Report missing/invalid members, D6h and convergence checks. Do not call a model intervention
physical necessity, mature morphology, grid independence or quantitative validation.

## Approach and admitted failure

Reuse the tested first-batch probe/launch/resume and process queue with one explicit batch
definition (identity, immutable rows, representative rows and named-host eligibility). A thin
second-batch entry point supplies that definition; old entry-point defaults retain the old roster
and receipt meanings. Probe/campaign receipt validation must reject cross-batch reuse. No new
scheduler, registry, generic workflow service or numerical implementation is needed.

Rule 14A: six actual first-batch rows failed at `renameSync(pending-generation, generation)` with
Windows EPERM. Existing immediate failure discards the just-computed uncommitted cycle and stops
the row. The underlying OS cause is unproven. A short bounded retry at the filesystem publication
boundary addresses transient EPERM/EACCES/EBUSY without repeating scientific updates, widening
checkpoint eligibility or swallowing persistent failure. Preserve atomic replacement and the prior
pointer; other errors fail immediately. The bounded I/O delay costs less than repeating long rows.
Nearest-boundary injected rename failures plus real saved/restored scientific state cover the
observed failure. Do not add automatic solver retries, runtime substitution or cross-source migration.

Relevant lessons: A3 concurrent writers requires the existing row/coordinator leases; E4 complete
reachable state requires the existing exact resume-state witnesses; F1/F2 require returning to
the scientific deliverable after the smallest repair. Read decisions 0060 and the first-batch
Tried and rejected section before changing recovery. Existing `discovery-resume.test.ts` and
`hil-bld-batch-resume.test.ts` are the relevant checks, not a new review framework.

## Execution and verification

Commit this plan before implementation. Use focused tests while changing the I/O boundary and
batch selection, then one bounded non-author review after interfaces stabilize and exact
`npm.cmd test` at a clean checkpoint under Rule 6. Pin project-owned evidence fitting Git in
`evidence/` with root manifest entries. Retain all old staging and checkpoints; no pruning/NAS
publication is part of this task. The representative real N64 pause/resume before launch witness
in `evidence/discovery-resume-2026-10-07/` covers the unchanged complete-cycle state contract;
publication fault tests additionally cover the changed filesystem boundary.

Requalify the actual new roster on HIL with three-update checkpointing prefixes, the 1/4/8/16
ladder and its separate 180-second probe watchdog. Those prefixes qualify only early resource
usage. Keep live memory protection and record actual concurrency; do not run heavy verification
alongside the capacity probe or production. Checkpoints publish initially and after every complete
cycle, retaining the preceding complete generation. Interrupted incomplete cycles repeat on resume.

Registered commands from the clean fixed execution checkout:

```powershell
node runner/src/hil-batch2-main.ts probe HIL out/batch2-hil-probe
node runner/src/hil-batch2-main.ts launch HIL out/batch2-hil out/batch2-hil-probe/probe.json
node runner/src/hil-batch2-main.ts resume HIL out/batch2-hil out/batch2-hil-probe/probe.json
```

For a visible coordinator, Ctrl+C stops its owned workers; for hidden execution record an exact
owned-process stop script and separate stdout/stderr/exit receipts before dispatch. Resume uses
the same source, runtime, host and output directory. Write live progress in primary after freezing
the execution HEAD. No timer terminates production. Do not start a duplicate coordinator.

## Source currency

Bounded check on 2026-10-08 rechecked arXiv submission histories for
[TAX2](https://arxiv.org/abs/2306.13087) (v1), [CM9](https://arxiv.org/abs/2011.02353) (v1),
[CM4](https://arxiv.org/abs/1512.03389) (v2), and the
[author publication list](https://www.its.caltech.edu/~atomic/publist/kglpub.htm).
No later snow-growth entry after TAX2 was found in that list; this bounded check is not exhaustive.
No source input or fitted parameter changes. These finite comparisons retain the current accepted
operator and provenance limitations.

## Steps

- [ ] Commit protocol and correct stale first-batch live state.
- [ ] Implement bounded checkpoint publication retry and sixteen-row batch selection.
- [ ] Verify fault handling, first-batch compatibility, selection and exact full check; preserve receipts.
- [ ] Reconcile task worktrees/branches, commit and publish shared source.
- [ ] Measure HIL capacity, launch new queue and record live checkpoints/commands.

## Out of scope

Old-checkpoint migration/recovery, BLD process control, larger grids/targets, scientific-law changes,
new physical validation, Phase 7 (maker hold), S6 (closed), education and asset cleanup.

## Tried and rejected

- Calling all 56 rows successfully complete: six operational failures remain unresolved. Distinguish
  a finished coordinator from successful scientific endpoints.
- Repeating the full deterministic first batch would duplicate fifty useful endpoints. New conditions
  answer the selected follow-up questions; retain failures for explicit recovery.
- Adding fraction .15 at the pressure midpoint solely to fill workers adds no necessary comparison
  to this bounded slice. The .10/.20 contrast and two seed quartets already make sixteen new rows.
- Reinstating a four-hour limit contradicts maker direction and decision 0060. Keep finite scientific
  endpoints and genuine checkpoints instead.

## Open questions

Persistent operating-system rename locks may still fail visibly after the bounded retry. The old
six source-bound checkpoints need an explicit recovery task; no scientific outcome is inferred
from them. Joint HIL/BLD endpoint review will determine any subsequent larger-growth question.
