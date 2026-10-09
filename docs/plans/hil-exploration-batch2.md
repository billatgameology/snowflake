# Plan — HIL second exploration batch

- **Phase:** post-Phase-10 development exploration under the approved HIL/BLD portfolio.
- **Status:** execution and internal comparison complete; all sixteen rows reached extent 21. [Joint review and retained output](../../evidence/hil-bld-joint-review-2026-10-08/README.md) own the current findings and locators.
- **Started / last touched:** 2026-10-08 by Codex/GPT-6.
- **Historical branch / checkout:** `codex/hil-exploration-batch2` at `4322807`, now retired after exact output preservation; all paths below are producer-era provenance unless superseded by the joint review.
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

The [tracked triage bundle](../../evidence/hil-exploration-batch2-2026-10-08/README.md) retains
the named measurements, complete receipts and exact source-byte archive behind these leads.

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

Hidden-run scripts are prepared in `out/batch2-hil-control-20261008/` in the execution checkout.
Exact pause: `powershell.exe -NoProfile -ExecutionPolicy Bypass -File out/batch2-hil-control-20261008/stop-hil.ps1`.
The script records and stops only this new entry point's campaign/probe workers and its own wrapper;
it retains all output. `resume-hil.ps1` runs the registered resume command in a persistent terminal.
`state.json`, distinct stdout/stderr logs and real exit receipts record qualification and production.

## Source currency

Bounded check on 2026-10-08 rechecked arXiv submission histories for
[TAX2](https://arxiv.org/abs/2306.13087) (v1), [CM9](https://arxiv.org/abs/2011.02353) (v1),
[CM4](https://arxiv.org/abs/1512.03389) (v2), and the
[author publication list](https://www.its.caltech.edu/~atomic/publist/kglpub.htm).
No later snow-growth entry after TAX2 was found in that list; this bounded check is not exhaustive.
No source input or fitted parameter changes. These finite comparisons retain the current accepted
operator and provenance limitations.

## Steps

- [x] Commit protocol and correct stale first-batch live state (`164384a`).
- [x] Implement bounded checkpoint publication retry and sixteen-row batch selection.
- [x] Verify fault handling, first-batch compatibility, selection and exact full check; preserve receipts.
- [x] Reconcile task worktrees/branches, commit and publish shared source.
- [x] Measure HIL capacity, launch new queue and record live checkpoints/commands.

## Out of scope

Old-checkpoint migration/recovery, BLD process control, larger grids/targets, scientific-law changes,
new physical validation, Phase 7 (maker hold), S6 (closed), education and asset cleanup.

## Implementation checkpoint

The new entry point reuses the existing runner with an explicit finite batch definition. Original
HIL/BLD roster SHA-256 values remain `333a1977961ecc7d70161157f8ebad117326e1a46729c1bbbfbf0f590f439f0b`
and `866adbd2c6534efa4ec1ca5659fc46d2f2d765c9d662e057862f4f77024912be`, independently recomputed
from retained `b9cf7ed` before the change and checked in `hil-batch2.test.ts`.
Only generation and pointer publication retry the named error codes; six delays total 1575 ms,
then the seventh failed rename propagates. Solver evolution and checkpoint state/eligibility do
not change. Tests save real cycle-two/cycle-three state and verify transient publication equality,
persistent failure's unchanged old pointer/state and immediate nonretryable failure.

One bounded non-author Codex/GPT-6 review with inherited shared context found no unresolved blocker.
It independently executed four batch-selection tests and ten publication-fault tests after the
fixture correction below. It read dispatch/receipt/row and I/O changes; it did not run the full
suite, an N64 probe, a campaign or recovery of old failures. Root's six-file focused runner/progress
check passed 47 tests; both typechecks passed before the final I/O addition. Exact full verification
at the clean combined checkpoint is next.

`first-batch-fresh-restore.json` in the tracked bundle records a successful fresh extraction of
457 archive members, with all 456 payload files / 95965035 bytes matching the inventory. The
12600583-byte archive has SHA-256 `4009f87d97d6360cc0cad403265a3ae94d014c6740f8052bb16aee6932d79175`.
All original bytes remain. Rule 16's `out/batch2-verification/worktree-inventory-before-publication.json`
classifies four checkouts: primary's two task-owned live prose copies are included and corrected;
both old execution sources/outputs remain retained; batch2 is the sole implementation branch.
There is no temporary review checkout, unrelated source delta, PR or deletion.

Exact `npm.cmd test` at clean `b9d7eb0d6d40a248fb36cf9621e411d3444ff681`, Node v24.13.1,
exited zero: 235 files / 3045 tests passed, 23 skipped; Vitest duration 947.51 seconds. Rule 7
and both typechecks are included. The tracked bundle's `verification.json`, exact invocation,
real result and raw stdout/stderr retain the evidence. No executable source changed afterward.
These are regression results, not a new scientific gate. Focused and initially failed fixture
logs are retained alongside them. Publication and a fresh new-roster HIL capacity probe are next.

## Publication and HIL execution 2026-10-08

Shared main was pushed and remotely verified at `43228078308cc089b9da8c6240975b267d7d74cb`
at `2026-10-08T14:57:31.7029379Z`. Primary's two former live startup prose files were first
copied and hash-verified in `out/hil-batch2-primary-reconciliation-20261008/`, then only those
included duplicates were reconciled before main fast-forward. All four worktrees were clean;
both original HIL output owners remain at their frozen sources. Execution
`out/batch2-verification/publication-inventory.json` and `publication.json` retain the exact audit.
No PR, temporary review checkout, branch deletion or output pruning occurred.

Hidden wrapper 27012 started at `2026-10-08T14:57:58.4239805Z` from the batch2 execution checkout.
`out/batch2-hil-control-20261008/invocation.json` records exact arguments, source, pause and resume
commands. No scientific or Vitest worker was present before launch. The wrapper performs the
registered resource probe, then dispatches only on successful qualification. Inspect `state.json`,
probe stdout/stderr and its real exit receipt before interpreting a phase as complete. Keep this
execution HEAD fixed; live prose is updated in primary only.

Probe exit zero is recorded at `2026-10-08T15:03:36.0825605Z`. Its `probe.json` qualifies
actual concurrency 1/4/8/16 and recommends sixteen. The sixteen-worker rung took 61.962 seconds;
minimum available physical memory was 50842497024 bytes and minimum commit headroom 58947198976
bytes. These are short-prefix measurements, not mature-geometry capacity claims.

Production launched at `2026-10-08T15:03:36.313Z` (08:03 PDT), recorded by
`out/batch2-hil/batch2-HIL-launch.json` and `campaign.json`, with all sixteen registered rows
and requested concurrency sixteen. Control `startup-check.json` at `2026-10-08T15:06:16.9700384Z`
observed sixteen live workers and sixteen advanced committed checkpoints, ticks 24 through 40.
Each observed solver payload matched its generation's recorded SHA-256. The retained resource
sample at `2026-10-08T15:06:13.5598886Z` contains sixteen children, 49997115392 available physical
bytes and 58137948160 bytes of commit headroom. Campaign stderr was empty at that inspection.
This establishes operational startup and checkpoint publication, not completed science.

Historical status at 08:42 PDT: all sixteen workers were active, with zero terminal results.
`out/batch2-hil-control-20261008/status-20261008T084236.json` records all sixteen rows at
extents 13 through 17 against target 21 and committed checkpoint ticks 217 through 277,
advanced from the startup observation. No campaign failure is recorded. The separate 08:43
read-only inspection found all sixteen attempt stderr logs empty and no result/exit receipts.
The resource log retains its timestamped samples; no memory stop was recorded. These are live
progress observations, not a completion percentage, endpoint verdict or morphology conclusion.

Live control/state/logs: `out/batch2-hil-control-20261008/`. Row commands, separate attempt
stdout/stderr/exits and checkpoints: `out/batch2-hil/rows/<row-id>/`. Production has no elapsed-time
deadline; scientific target extent 21 and the registered controls remain. Exact pause and resume
commands are above and in `invocation.json`. Preserve the entire execution checkout and output.

## Completion 2026-10-08

`out/batch2-hil/batch2-HIL-complete.json` records completion at `2026-10-08T16:31:15.776Z`
(09:31 PDT): all sixteen worker exits are zero, no abort and no unstarted row. Control
`campaign-exit.json` independently records wrapper exit zero at `2026-10-08T16:31:16.1412329Z`.
The existing `node runner/src/hil-batch2-main.ts summarize out/batch2-hil` command was executed
after completion. All sixteen rows are `size-endpoint`, all final extents are 21, and every
summary error list is empty. This checker reads the persisted event sequences and numerical
diagnostics rather than inheriting endpoint status from a process exit alone.

The complete result census is `out/batch2-hil/summary.json`, with a dated copy in control
`completion-summary-20261008.json`. Primary
`out/hil-status-20261008T160558/completion-status.json` retains its full record and hash alongside
the completion receipt. At `2026-10-08T23:05:59.0079544Z` no matching HIL worker or coordinator
was present. Outputs, checkpoint generations and the fixed execution source remain retained.

Next: apply the registered seed/pressure readout using all first-batch controls, including the
six now-recovered endpoints, and gather BLD's separate results for joint review. This operational
completion does not supply a morphology conclusion, physical-validation claim or authority for
another campaign. No BLD process was inspected, stopped or launched.

## Tried and rejected

- The first publication-fault fixture replaced an old committed event prefix with an independently
  executed run's RSS-bearing bytes, so persistent-failure loads correctly rejected the digest.
  Root observed two failures, the reviewer four under different RSS. Preserve the actual old prefix
  and append only the third observation. Ten fault tests then pass; no I/O behavior was changed
  to accommodate the faulty fixture. Original focused logs remain in verification staging.

- Calling the original 56-row attempt fully successful: six operational failures were unresolved
  then and only reached endpoints in the separate recovery. Distinguish an attempt from its recovery.
- Repeating the full deterministic first batch would duplicate fifty useful endpoints. New conditions
  answer the selected follow-up questions; retain failures for explicit recovery.
- Adding fraction .15 at the pressure midpoint solely to fill workers adds no necessary comparison
  to this bounded slice. The .10/.20 contrast and two seed quartets already make sixteen new rows.
- Reinstating a four-hour limit contradicts maker direction and decision 0060. Keep finite scientific
  endpoints and genuine checkpoints instead.

## Open questions

Persistent operating-system rename locks may still fail visibly after the bounded retry. Joint
HIL/BLD endpoint review will determine any subsequent larger-growth question.

The maker separately requested that recovery on 2026-10-08. The
[first-batch recovery record](hil-bld-first-batch.md#explicit-six-row-recovery--2026-10-08)
owns the completed six-row continuation. It left this execution source unchanged and waited for
released slots under the combined HIL ceiling of sixteen. All six now have checked size endpoints.
